import React, { useState } from "react";
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
  TablePagination,
  Checkbox,
  Button,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";

const TrackSelector = ({ tracks, selectedTracks, onSelectionChange }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // Filter tracks based on search term
  const filteredTracks = tracks.filter((track) => {
    const searchLower = search.toLowerCase();
    return (
      (track.name && track.name.toLowerCase().includes(searchLower)) ||
      (track.artist && track.artist.toLowerCase().includes(searchLower)) ||
      (track.album && track.album.toLowerCase().includes(searchLower))
    );
  });

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

    // Update select all checkbox if necessary
    if (newSelected.length === filteredTracks.length) {
      setSelectAll(true);
    } else if (selectAll) {
      setSelectAll(false);
    }
  };

  // Handle select all tracks
  const handleSelectAllClick = () => {
    if (selectAll) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredTracks.map((track) => track.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0); // Reset page when search changes
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
          {selectAll ? "Deselect All" : "Select All"}
        </Button>
      </Box>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedTracks.length > 0 &&
                      selectedTracks.length < filteredTracks.length
                    }
                    checked={selectAll}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
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
              {filteredTracks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((track) => {
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
              {filteredTracks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No tracks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTracks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

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
