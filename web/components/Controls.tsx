import SpeedControls from "@/components/SpeedControls";

interface ControlsProps {
  onSpeedChange: (speed: number) => void;
}

export default function Controls({ onSpeedChange }: ControlsProps) {
  return (
    <div
      style={{
        margin: "16px",
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        border: "1px",
      }}
    >
      <SpeedControls onSpeedChange={onSpeedChange} />
    </div>
  );
}
