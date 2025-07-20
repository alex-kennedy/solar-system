import React, { useState } from "react";

import PauseIcon from "@mui/icons-material/Pause";
import ToggleButton from "@mui/material/ToggleButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

enum Speed {
  FastReverse = -10000000,
  Reverse = -2000000,
  Stop = 0,
  Forward = 2000000,
  FastForward = 10000000,
}

interface SpeedControlsProps {
  onSpeedChange: (speed: Speed) => void;
}

export default function SpeedControls({ onSpeedChange }: SpeedControlsProps) {
  const [speed, setSpeed] = useState<Speed>(Speed.Stop);

  const handleSpeedChange = (
    event: React.MouseEvent<HTMLElement>,
    newSpeed: Speed | null
  ) => {
    if (newSpeed != null) {
      setSpeed(newSpeed);
      onSpeedChange(newSpeed);
    }
  };

  return (
    <div>
      <ToggleButtonGroup
        value={speed}
        exclusive
        onChange={handleSpeedChange}
        aria-label="speed control"
      >
        <ToggleButton value={Speed.FastReverse} aria-label="fast reverse">
          <FastRewindIcon />
        </ToggleButton>
        <ToggleButton value={Speed.Reverse} aria-label="reverse">
          <PlayArrowIcon style={{ rotate: "180deg" }} />
        </ToggleButton>
        <ToggleButton value={Speed.Stop} aria-label="stopped">
          <PauseIcon />
        </ToggleButton>
        <ToggleButton value={Speed.Forward} aria-label="forward">
          <PlayArrowIcon />
        </ToggleButton>
        <ToggleButton value={Speed.FastForward} aria-label="fast forward">
          <FastForwardIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
