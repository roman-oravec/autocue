import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import { FixedSizeList as VirtualizedList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

// Track row component optimized with memo to prevent unnecessary renders
const TrackRow = React.memo(({ track, isSelected, onToggle }) => {
  return (
    <TableRow
      hover
      onClick={() => onToggle(track.id)}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={-1}
      selected={isSelected}
      sx={{ cursor: "pointer" }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={isSelected} />
      </TableCell>
      <TableCell>{track.name}</TableCell>
      <TableCell>{track.artist}</TableCell>
      <TableCell>{track.bpm ? track.bpm.toFixed(2) : "N/A"}</TableCell>
      <TableCell>{track.key || "N/A"}</TableCell>
      <TableCell align="right">{track.hotCues?.length || 0}</TableCell>
      <TableCell align="right">{track.memoryCues?.length || 0}</TableCell>
    </TableRow>
  );
});

const TrackSelector = ({
  tracks,
  selectedTracks,
  onSelectionChange,
  playlists = [],
}) => {
  const [search, setSearch] = useState("");
  const [expandedPlaylists, setExpandedPlaylists] = useState({});
  const [renderedPlaylist, setRenderedPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create a map of track IDs to track objects for fast lookup
  const trackMap = useMemo(() => {
    const map = new Map();
    tracks.forEach((track) => map.set(track.id, track));
    return map;
  }, [tracks]);

  // Filter tracks based on search term
  const filteredTracks = useMemo(() => {
    if (!search.trim()) return tracks;

    const searchLower = search.toLowerCase();
    return tracks.filter((track) => {
      return (
        (track.name && track.name.toLowerCase().includes(searchLower)) ||
        (track.artist && track.artist.toLowerCase().includes(searchLower)) ||
        (track.album && track.album.toLowerCase().includes(searchLower))
      );
    });
  }, [tracks, search]);

  // Create a filtered track map for faster lookups
  const filteredTrackMap = useMemo(() => {
    const map = new Set();
    filteredTracks.forEach((track) => map.add(track.id));
    return map;
  }, [filteredTracks]);

  // Filter playlists to only include those with tracks that match the search
  const filteredPlaylists = useMemo(() => {
    return playlists
      .map((playlist) => {
        const validTrackIds = playlist.trackIds.filter(
          (id) => trackMap.has(id) && filteredTrackMap.has(id)
        );

        return {
          ...playlist,
          filteredTrackIds: validTrackIds,
          expanded: !!expandedPlaylists[playlist.id],
        };
      })
      .filter((playlist) => playlist.filteredTrackIds.length > 0);
  }, [playlists, trackMap, filteredTrackMap, expandedPlaylists]);

  // Handle track selection - optimized with useCallback
  const handleToggleTrack = useCallback(
    (trackId) => {
      onSelectionChange((prev) => {
        const isSelected = prev.includes(trackId);
        return isSelected
          ? prev.filter((id) => id !== trackId)
          : [...prev, trackId];
      });
    },
    [onSelectionChange]
  );

  // Handle select all visible tracks
  const handleSelectAllClick = useCallback(() => {
    const allVisible = filteredTracks.map((track) => track.id);
    const allSelected = allVisible.every((id) => selectedTracks.includes(id));

    if (allSelected) {
      // Deselect all visible tracks
      onSelectionChange(
        selectedTracks.filter((id) => !allVisible.includes(id))
      );
    } else {
      // Select all visible tracks
      const newSelected = new Set(selectedTracks);
      allVisible.forEach((id) => newSelected.add(id));
      onSelectionChange(Array.from(newSelected));
    }
  }, [filteredTracks, selectedTracks, onSelectionChange]);

  // Handle selecting all tracks in a playlist
  const handleSelectPlaylistTracks = useCallback(
    (trackIds, e) => {
      e.stopPropagation(); // Prevent accordion from toggling

      const allSelected = trackIds.every((id) => selectedTracks.includes(id));

      if (allSelected) {
        // Deselect all tracks in this playlist
        onSelectionChange(
          selectedTracks.filter((id) => !trackIds.includes(id))
        );
      } else {
        // Select all tracks in this playlist
        const newSelected = new Set(selectedTracks);
        trackIds.forEach((id) => newSelected.add(id));
        onSelectionChange(Array.from(newSelected));
      }
    },
    [selectedTracks, onSelectionChange]
  );

  // Handle accordion expansion with debouncing to prevent performance issues
  const handleAccordionToggle = useCallback(
    (playlistId) => {
      // Don't allow multiple expanded playlists at once for performance reasons
      setExpandedPlaylists((prev) => {
        const newState = { ...prev };

        // Close any currently open playlists
        Object.keys(newState).forEach((key) => {
          newState[key] = false;
        });

        // Toggle the clicked playlist
        newState[playlistId] = !prev[playlistId];

        return newState;
      });

      // If we're expanding, set this playlist as the rendered one
      // If we're collapsing, clear the rendered playlist
      setRenderedPlaylist(expandedPlaylists[playlistId] ? null : playlistId);

      // Show loading for large playlists
      const playlist = playlists.find((p) => p.id === playlistId);
      if (
        playlist &&
        !expandedPlaylists[playlistId] &&
        playlist.trackIds.length > 100
      ) {
        setLoading(true);
        // Use setTimeout to allow the UI to update before rendering the tracks
        setTimeout(() => setLoading(false), 50);
      }
    },
    [expandedPlaylists, playlists]
  );

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    // Close any open playlists when searching
    setExpandedPlaylists({});
    setRenderedPlaylist(null);
  }, []);

  // Get playlist selection state
  const getPlaylistSelectionState = useCallback(
    (trackIds) => {
      if (!trackIds.length) return "none";

      const selectedCount = trackIds.filter((id) =>
        selectedTracks.includes(id)
      ).length;

      if (selectedCount === 0) return "none";
      if (selectedCount === trackIds.length) return "all";
      return "some";
    },
    [selectedTracks]
  );

  // Virtualized row renderer for track lists
  const VirtualizedTrackRow = useCallback(({ index, style, data }) => {
    const { trackIds, trackMap, selectedTracks, handleToggleTrack } = data;
    const trackId = trackIds[index];
    const track = trackMap.get(trackId);

    if (!track) return null;

    const isSelected = selectedTracks.includes(trackId);

    return (
      <div style={style}>
        <TableRow
          hover
          onClick={() => handleToggleTrack(trackId)}
          role="checkbox"
          aria-checked={isSelected}
          selected={isSelected}
          sx={{ cursor: "pointer", display: "flex" }}
        >
          <TableCell padding="checkbox" sx={{ flex: "0 0 50px" }}>
            <Checkbox checked={isSelected} />
          </TableCell>
          <TableCell sx={{ flex: 2 }}>{track.name}</TableCell>
          <TableCell sx={{ flex: 1 }}>{track.artist}</TableCell>
          <TableCell sx={{ flex: "0 0 80px" }}>
            {track.bpm ? track.bpm.toFixed(2) : "N/A"}
          </TableCell>
          <TableCell sx={{ flex: "0 0 60px" }}>{track.key || "N/A"}</TableCell>
          <TableCell align="right" sx={{ flex: "0 0 80px" }}>
            {track.hotCues?.length || 0}
          </TableCell>
          <TableCell align="right" sx={{ flex: "0 0 80px" }}>
            {track.memoryCues?.length || 0}
          </TableCell>
        </TableRow>
      </div>
    );
  }, []);

  // Optimized virtualized table for playlists
  const renderOptimizedPlaylistTracks = useCallback(
    (playlist) => {
      const trackIds = playlist.filteredTrackIds;

      if (trackIds.length === 0) {
        return (
          <Box p={2} textAlign="center">
            No tracks found
          </Box>
        );
      }

      return (
        <Box sx={{ height: 400, width: "100%" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  borderBottom: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "background.paper",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                <TableCell
                  padding="checkbox"
                  sx={{ flex: "0 0 50px" }}
                ></TableCell>
                <TableCell sx={{ flex: 2 }}>
                  <strong>Track</strong>
                </TableCell>
                <TableCell sx={{ flex: 1 }}>
                  <strong>Artist</strong>
                </TableCell>
                <TableCell sx={{ flex: "0 0 80px" }}>
                  <strong>BPM</strong>
                </TableCell>
                <TableCell sx={{ flex: "0 0 60px" }}>
                  <strong>Key</strong>
                </TableCell>
                <TableCell align="right" sx={{ flex: "0 0 80px" }}>
                  <strong>Hot</strong>
                </TableCell>
                <TableCell align="right" sx={{ flex: "0 0 80px" }}>
                  <strong>Memory</strong>
                </TableCell>
              </Box>
              <AutoSizer>
                {({ height, width }) => (
                  <VirtualizedList
                    height={height - 35} // Subtract header height
                    width={width}
                    itemCount={trackIds.length}
                    itemSize={40} // Row height
                    itemData={{
                      trackIds,
                      trackMap,
                      selectedTracks,
                      handleToggleTrack,
                    }}
                  >
                    {VirtualizedTrackRow}
                  </VirtualizedList>
                )}
              </AutoSizer>
            </>
          )}
        </Box>
      );
    },
    [trackMap, selectedTracks, handleToggleTrack, loading]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Select Tracks
      </Typography>
      <Typography paragraph>
        Choose which tracks you want to add cue points to. You can search by
        track name, artist, or album.
      </Typography>

      <Box sx={{ display: "flex", mb: 3, alignItems: "center" }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search tracks"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PlaylistAddCheckIcon />}
          onClick={handleSelectAllClick}
        >
          {filteredTracks.length > 0 &&
          filteredTracks.every((track) => selectedTracks.includes(track.id))
            ? "Deselect All"
            : "Select All"}
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        {filteredPlaylists.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: "center" }}>
            No playlists found with matching tracks
          </Typography>
        ) : (
          filteredPlaylists.map((playlist) => {
            if (playlist.filteredTrackIds.length === 0) return null;

            const selectionState = getPlaylistSelectionState(
              playlist.filteredTrackIds
            );

            return (
              <Accordion
                key={playlist.id}
                expanded={!!expandedPlaylists[playlist.id]}
                onChange={() => handleAccordionToggle(playlist.id)}
                sx={{ mb: 1 }}
                TransitionProps={{ unmountOnExit: true }} // Unmount content when closed for performance
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    "& .MuiAccordionSummary-content": {
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tooltip
                      title={
                        selectionState === "all"
                          ? "Deselect all in this playlist"
                          : "Select all in this playlist"
                      }
                    >
                      <IconButton
                        onClick={(e) =>
                          handleSelectPlaylistTracks(
                            playlist.filteredTrackIds,
                            e
                          )
                        }
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        {selectionState === "all" && (
                          <CheckBoxIcon color="primary" />
                        )}
                        {selectionState === "some" && (
                          <IndeterminateCheckBoxIcon color="primary" />
                        )}
                        {selectionState === "none" && (
                          <CheckBoxOutlineBlankIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {playlist.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {playlist.filteredTrackIds.length} tracks
                    {selectionState !== "none" &&
                      ` (${
                        playlist.filteredTrackIds.filter((id) =>
                          selectedTracks.includes(id)
                        ).length
                      } selected)`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  {expandedPlaylists[playlist.id] &&
                    renderOptimizedPlaylistTracks(playlist)}
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box
        sx={{
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography>
          {selectedTracks.length} of {filteredTracks.length} tracks selected
        </Typography>
      </Box>
    </Box>
  );
};

export default TrackSelector;
