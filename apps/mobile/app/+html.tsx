import React from "react";
import { ScrollViewStyleReset } from "expo-router/html";
export default function HTML({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#10121B" />
        <meta
          name="description"
          content="Private outdoor multiplayer adventures. Your friends. Your neighborhood. A whole new way to play."
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <ScrollViewStyleReset />
        <style>{`html,body,#root{height:100%;background:#10121B}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}button,a{touch-action:manipulation}input,textarea{font-size:16px}*:focus-visible{outline:2px solid #A6A9FF;outline-offset:4px}body{overscroll-behavior-y:none}.maplibregl-ctrl-attrib{font-size:10px}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
