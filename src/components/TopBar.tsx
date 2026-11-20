"use client";

import { Icon } from "./ui";

interface TopBarProps {
  uiHidden: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onToggleUi: () => void;
  onPresent: () => void;
  onOpenSheet: (sheet: "left" | "right") => void;
}

export function TopBar({
  uiHidden,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onToggleUi,
  onPresent,
  onOpenSheet,
}: TopBarProps) {
  return (
    <div className="topbar">
      <button
        type="button"
        className="icon-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl/Cmd + Z)"
      >
        <Icon name="undo" size={17} />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl/Cmd + Shift + Z)"
      >
        <Icon name="redo" size={17} />
      </button>
      <span className="divider" />
      <button type="button" className="tool-btn" onClick={onReset} title="Start over">
        <Icon name="reset" size={16} />
        Reset
      </button>
      <span className="divider" />
      <button
        type="button"
        className="tool-btn"
        onClick={onToggleUi}
        title={uiHidden ? "Show the interface (H)" : "Hide the interface (H)"}
      >
        <Icon name="eye" size={16} />
        {uiHidden ? "Show UI" : "Hide UI"}
      </button>
      <button type="button" className="tool-btn is-primary" onClick={onPresent} title="Fullscreen light mode (F)">
        <Icon name="expand" size={16} />
        Present
        <kbd>F</kbd>
      </button>
      <span className="divider mobile-only" />
      <button
        type="button"
        className="icon-btn mobile-only"
        onClick={() => onOpenSheet("left")}
        title="Lights and scenes"
      >
        <Icon name="plus" size={17} />
      </button>
      <button
        type="button"
        className="icon-btn mobile-only"
        onClick={() => onOpenSheet("right")}
        title="Inspector"
      >
        <Icon name="wand" size={17} />
      </button>
    </div>
  );
}
