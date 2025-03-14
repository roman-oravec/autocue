import React from "react";
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Radio,
  RadioGroup,
  Grid,
  Paper,
  Divider,
  Slider,
  Alert,
} from "@mui/material";

const ConfigPanel = ({ config, onChange }) => {
  // Handle simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  // Handle numeric input changes with validation
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ [name]: numValue });
    }
  };

  // Handle slider changes
  const handleSliderChange = (name) => (e, newValue) => {
    onChange({ [name]: newValue });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Configure Cue Points
      </Typography>
      <Typography paragraph>
        Set up your cue point preferences. You can add cues before and after
        reference points.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        A reference point can be the first/last hot cue, a specific hot cue, or
        the intro/outro point.
      </Alert>

      <Grid container spacing={4}>
        {/* Before Reference Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Cues Before Reference Point
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth margin="normal">
              <InputLabel id="before-reference-label">
                Reference Point (Before)
              </InputLabel>
              <Select
                labelId="before-reference-label"
                name="beforeReference"
                value={config.beforeReference}
                label="Reference Point (Before)"
                onChange={handleInputChange}
              >
                <MenuItem value="firstHotCue">First Hot Cue</MenuItem>
                <MenuItem value="specificHotCue">Specific Hot Cue</MenuItem>
                <MenuItem value="intro">Intro Point</MenuItem>
              </Select>
            </FormControl>

            {config.beforeReference === "specificHotCue" && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="specific-before-cue-label">
                  Specific Hot Cue
                </InputLabel>
                <Select
                  labelId="specific-before-cue-label"
                  name="specificBeforeCue"
                  value={config.specificBeforeCue}
                  label="Specific Hot Cue"
                  onChange={handleInputChange}
                >
                  {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => (
                    <MenuItem key={letter} value={letter}>
                      Hot Cue {letter}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography id="before-count-slider" gutterBottom>
                Number of Cues to Add: {config.beforeCount}
              </Typography>
              <Slider
                aria-labelledby="before-count-slider"
                value={config.beforeCount}
                onChange={handleSliderChange("beforeCount")}
                step={1}
                marks
                min={0}
                max={8}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography id="before-interval-slider" gutterBottom>
                Interval Between Cues (bars): {config.beforeInterval}
              </Typography>
              <Slider
                aria-labelledby="before-interval-slider"
                value={config.beforeInterval}
                onChange={handleSliderChange("beforeInterval")}
                step={1}
                marks
                min={1}
                max={32}
                valueLabelDisplay="auto"
              />
            </Box>
          </Paper>
        </Grid>

        {/* After Reference Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Cues After Reference Point
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth margin="normal">
              <InputLabel id="after-reference-label">
                Reference Point (After)
              </InputLabel>
              <Select
                labelId="after-reference-label"
                name="afterReference"
                value={config.afterReference}
                label="Reference Point (After)"
                onChange={handleInputChange}
              >
                <MenuItem value="lastHotCue">Last Hot Cue</MenuItem>
                <MenuItem value="specificHotCue">Specific Hot Cue</MenuItem>
                <MenuItem value="outro">Outro Point</MenuItem>
              </Select>
            </FormControl>

            {config.afterReference === "specificHotCue" && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="specific-after-cue-label">
                  Specific Hot Cue
                </InputLabel>
                <Select
                  labelId="specific-after-cue-label"
                  name="specificAfterCue"
                  value={config.specificAfterCue}
                  label="Specific Hot Cue"
                  onChange={handleInputChange}
                >
                  {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => (
                    <MenuItem key={letter} value={letter}>
                      Hot Cue {letter}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography id="after-count-slider" gutterBottom>
                Number of Cues to Add: {config.afterCount}
              </Typography>
              <Slider
                aria-labelledby="after-count-slider"
                value={config.afterCount}
                onChange={handleSliderChange("afterCount")}
                step={1}
                marks
                min={0}
                max={8}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography id="after-interval-slider" gutterBottom>
                Interval Between Cues (bars): {config.afterInterval}
              </Typography>
              <Slider
                aria-labelledby="after-interval-slider"
                value={config.afterInterval}
                onChange={handleSliderChange("afterInterval")}
                step={1}
                marks
                min={1}
                max={32}
                valueLabelDisplay="auto"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Cue Type Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cue Type
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl component="fieldset">
              <RadioGroup
                row
                name="cueType"
                value={config.cueType}
                onChange={handleInputChange}
              >
                <FormControlLabel
                  value="memory"
                  control={<Radio />}
                  label="Memory Cues"
                />
                <FormControlLabel
                  value="hot"
                  control={<Radio />}
                  label="Hot Cues"
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigPanel;
