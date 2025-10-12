import React from "react";

interface StatTileProps {
  label: string;
  value: number | string;
}

const StatTile: React.FC<StatTileProps> = ({ label, value }) => {
  return (
    <div className="rounded-lg border p-4 flex flex-col items-center justify-center text-center bg-card">
      <span className="text-3xl font-bold mb-1" data-testid="stat-value">
        {value}
      </span>
      <span className="text-sm text-muted-foreground" data-testid="stat-label">
        {label}
      </span>
    </div>
  );
};

export default StatTile;
