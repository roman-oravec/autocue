import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";

const TrackSelector = ({
  tracks,
  selectedTracks,
  onSelectionChange,
  playlists = [],
}) => {
  const [search, setSearch] = useState("");
  const [expandedPlaylists, setExpandedPlaylists] = useState({});

  // Filter tracks based on search term
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const searchLower = search.toLowerCase();
      return (
        (track.name && track.name.toLowerCase().includes(searchLower)) ||
        (track.artist && track.artist.toLowerCase().includes(searchLower)) ||
        (track.album && track.album.toLowerCase().includes(searchLower))
      );
    });
  }, [tracks, search]);

  // Organize tracks by playlist
  const tracksByPlaylist = useMemo(() => {
    // Create a map of trackId -> track for quick lookup
    const trackMap = new Map(tracks.map((track) => [track.id, track]));

    // Organize tracks by playlist
    const result = {
      // Add an "All Tracks" section for tracks not in any playlist
      allTracks: {
        name: "All Tracks",
        trackIds: filteredTracks.map((track) => track.id),
        expanded: false,
      },
    };

    // Add each playlist and its tracks
    playlists.forEach((playlist) => {
      const playlistTrackIds = playlist.trackIds || [];

      // Only include tracks that match the filter and exist in our data
      const validTrackIds = playlistTrackIds.filter(
        (id) => trackMap.has(id) && filteredTracks.some((t) => t.id === id)
      );

      if (validTrackIds.length > 0) {
        result[playlist.id] = {
          name: playlist.name,
          trackIds: validTrackIds,
          expanded: !!expandedPlaylists[playlist.id],
        };
      }
    });

    return result;
  }, [filteredTracks, playlists, tracks, expandedPlaylists]);

  // Handle track selection
  const handleToggleTrack = (trackId) => {
    const isSelected = selectedTracks.includes(trackId);
    let newSelected = [];

    if (isSelected) {
      newSelected = selectedTracks.filter((id) => id !== trackId);
    } else {
      newSelected = [...selectedTracks, trackId];
    }

    onSelectionChange(newSelected);
  };

  // Handle select all tracks
  const handleSelectAllClick = () => {
    if (selectedTracks.length === filteredTracks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredTracks.map((track) => track.id));
    }
  };

  // Handle selecting all tracks in a playlist
  const handleSelectPlaylistTracks = (trackIds) => {
    const allSelected = trackIds.every((id) => selectedTracks.includes(id));
    let newSelected;

    if (allSelected) {
      // Deselect all tracks in this playlist
      newSelected = selectedTracks.filter((id) => !trackIds.includes(id));
    } else {
      // Select all tracks in this playlist
      const currentlySelected = new Set(selectedTracks);
      trackIds.forEach((id) => currentlySelected.add(id));
      newSelected = Array.from(currentlySelected);
    }

    onSelectionChange(newSelected);
  };

  // Handle accordion expansion
  const handleAccordionToggle = (playlistId) => {
    setExpandedPlaylists((prev) => ({
      ...prev,
      [playlistId]: !prev[playlistId],
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Get playlist selection state
  const getPlaylistSelectionState = (trackIds) => {
    if (!trackIds.length) return "none";

    const selectedCount = trackIds.filter((id) =>
      selectedTracks.includes(id)
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === trackIds.length) return "all";
    return "some";
  };

  // Render a playlist's tracks table
  const renderPlaylistTracks = (trackIds) => {
    return (
      <TableContainer sx={{ maxHeight: "400px" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>
                <strong>Track</strong>
              </TableCell>
              <TableCell>
                <strong>Artist</strong>
              </TableCell>
              <TableCell>
                <strong>BPM</strong>
              </TableCell>
              <TableCell>
                <strong>Key</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Hot Cues</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Memory Cues</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trackIds.map((trackId) => {
              const track = tracks.find((t) => t.id === trackId);
              if (!track) return null;

              const isSelected = selectedTracks.includes(track.id);
              return (
                <TableRow
                  hover
                  onClick={() => handleToggleTrack(track.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={-1}
                  key={track.id}
                  selected={isSelected}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={isSelected} />
                  </TableCell>
                  <TableCell>{track.name}</TableCell>
                  <TableCell>{track.artist}</TableCell>
                  <TableCell>
                    {track.bpm ? track.bpm.toFixed(2) : "N/A"}
                  </TableCell>
                  <TableCell>{track.key || "N/A"}</TableCell>
                  <TableCell align="right">
                    {track.hotCues?.length || 0}
                  </TableCell>
                  <TableCell align="right">
                    {track.memoryCues?.length || 0}
                  </TableCell>
                </TableRow>
              );
            })}
            {trackIds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tracks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

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
          {selectedTracks.length === filteredTracks.length &&
          filteredTracks.length > 0
            ? "Deselect All"
            : "Select All"}
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        {/* Render playlists as accordions */}
        {Object.entries(tracksByPlaylist).map(([playlistId, playlist]) => {
          if (playlist.trackIds.length === 0) return null;

          const selectionState = getPlaylistSelectionState(playlist.trackIds);

          return (
            <Accordion
              key={playlistId}
              expanded={playlist.expanded}
              onChange={() => handleAccordionToggle(playlistId)}
              sx={{ mb: 1 }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlaylistTracks(playlist.trackIds);
                      }}
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
                  {playlist.trackIds.length} tracks
                  {selectionState !== "none" &&
                    ` (${
                      playlist.trackIds.filter((id) =>
                        selectedTracks.includes(id)
                      ).length
                    } selected)`}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                <Box sx={{ borderTop: "1px solid rgba(0, 0, 0, 0.12)" }}>
                  {renderPlaylistTracks(playlist.trackIds)}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
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
