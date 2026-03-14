import { ImageResponse } from "next/og";
import { APP_ICON_EMOJI } from "../lib/assets";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

const iconRootStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 360,
  background: "#ffffff",
} as const;

export default function Icon() {
  return new ImageResponse(
    <div style={iconRootStyle}>{APP_ICON_EMOJI}</div>,
    {
      ...size,
    }
  );
}
