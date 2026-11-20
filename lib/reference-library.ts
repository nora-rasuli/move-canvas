export type ReferenceClip = {
  id: string;
  mode: "dance-coach" | "tennis-coach";
  label: string;
  description: string;
  src: string;
  sourceUrl: string;
  licenseUrl: string;
};

export const REFERENCE_CLIPS: ReferenceClip[] = [
  {
    id: "flower-field-flow",
    mode: "dance-coach",
    label: "Flower field flow",
    description: "A bright, full-body solo dance with broad turns and arm shapes.",
    src: "/reference-clips/dance-flower-field.mp4",
    sourceUrl:
      "https://mixkit.co/free-stock-video/girl-dancing-happily-in-a-field-of-flowers-4702/",
    licenseUrl: "https://mixkit.co/license/#videoFree",
  },
  {
    id: "urban-court-flow",
    mode: "dance-coach",
    label: "Urban court flow",
    description: "A faster solo routine with clearer level and direction changes.",
    src: "/reference-clips/dance-urban-court.mp4",
    sourceUrl:
      "https://mixkit.co/free-stock-video/talented-urban-woman-dancing-at-night-on-a-basketball-court-51314/",
    licenseUrl: "https://mixkit.co/license/#videoFree",
  },
  {
    id: "tennis-serve",
    mode: "tennis-coach",
    label: "Serve reference",
    description: "A full-body serve sequence for reference-relative shadow practice.",
    src: "/reference-clips/tennis-serve.mp4",
    sourceUrl: "https://mixkit.co/free-stock-video/tennis-player-serving-873/",
    licenseUrl: "https://mixkit.co/license/#videoFree",
  },
  {
    id: "tennis-rally",
    mode: "tennis-coach",
    label: "Forehand reference",
    description: "A full-body rally clip with repeated forehand movement patterns.",
    src: "/reference-clips/tennis-rally.mp4",
    sourceUrl: "https://mixkit.co/free-stock-video/man-playing-tennis-877/",
    licenseUrl: "https://mixkit.co/license/#videoFree",
  },
];

export const clipsForMode = (mode: ReferenceClip["mode"]) =>
  REFERENCE_CLIPS.filter((clip) => clip.mode === mode);
