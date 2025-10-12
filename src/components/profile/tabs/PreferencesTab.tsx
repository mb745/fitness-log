import React, { useEffect } from "react";
import { Switch } from "../../ui/switch";

interface PreferenceToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

const ToggleRow: React.FC<PreferenceToggleProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span>{label}</span>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

const PreferencesTab: React.FC = () => {
  const [sound, setSound] = React.useState(() => localStorage.getItem("pref_sound") === "true");
  const [progression, setProgression] = React.useState(() => localStorage.getItem("pref_progression") !== "false");
  const [stagnation, setStagnation] = React.useState(() => localStorage.getItem("pref_stagnation") !== "false");

  useEffect(() => {
    localStorage.setItem("pref_sound", String(sound));
  }, [sound]);
  useEffect(() => {
    localStorage.setItem("pref_progression", String(progression));
  }, [progression]);
  useEffect(() => {
    localStorage.setItem("pref_stagnation", String(stagnation));
  }, [stagnation]);

  return (
    <div className="max-w-md space-y-3">
      <ToggleRow label="Dźwięki aplikacji" value={sound} onChange={setSound} />
      <ToggleRow label="Sugestie progresji" value={progression} onChange={setProgression} />
      <ToggleRow label="Alert stagnacji" value={stagnation} onChange={setStagnation} />
    </div>
  );
};

export default PreferencesTab;
