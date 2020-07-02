import React from "react";
import Textile from "../../assets/textile.jpg";
import GitHubButton from "react-github-btn";

export default function Footer() {
  return (
    <div>
      <h3>Built Using</h3>
      <img src={Textile} width="64" />
      <br />
      <br />
      <GitHubButton
        href="https://github.com/filecoin-shipyard/meme-marketplace"
        data-color-scheme="no-preference: light; light: light; dark: dark;"
        data-size="large"
        data-show-count="true"
        aria-label="Star filecoin-shipyard/meme-marketplace on GitHub"
      >
        Star
      </GitHubButton>
    </div>
  );
}
