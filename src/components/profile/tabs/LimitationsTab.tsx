import React, { useEffect } from "react";
import { useProfile } from "../../../lib/hooks/profile";
import { useDebounce } from "@uidotdev/usehooks";

const LimitationsTab: React.FC = () => {
  const { data: profile, updateProfile } = useProfile();
  const [text, setText] = React.useState(profile?.injuries_limitations ?? "");
  const debounced = useDebounce(text, 2000);

  useEffect(() => {
    setText(profile?.injuries_limitations ?? "");
  }, [profile]);

  useEffect(() => {
    if (debounced !== (profile?.injuries_limitations ?? "")) {
      updateProfile({ injuries_limitations: debounced });
    }
  }, [debounced, updateProfile, profile?.injuries_limitations]);

  return (
    <div className="max-w-xl">
      <label htmlFor="injuries_limitations" className="block text-sm font-medium mb-1">
        Kontuzje / ograniczenia
      </label>
      <textarea
        id="injuries_limitations"
        className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Opisz ewentualne kontuzje lub ograniczenia zdrowotne..."
      />
    </div>
  );
};

export default LimitationsTab;
