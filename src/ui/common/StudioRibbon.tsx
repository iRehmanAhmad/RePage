import React from 'react';
import { AppIcon } from '../icons/AppIcon';

export type ActiveTool = 'select' | 'text' | 'rectangle' | 'image' | 'pan';

export interface StudioRibbonProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeFontFamily: string;
  onFontFamilyChange: (font: string) => void;
  activeFontSize: number;
  onFontSizeChange: (size: number) => void;
  isKashidaEnabled: boolean;
  onToggleKashida: () => void;
  activeAlignment: string;
  onAlignmentChange: (align: string) => void;
}

export const StudioRibbon: React.FC<StudioRibbonProps> = ({
  activeTool,
  onSelectTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeFontFamily,
  onFontFamilyChange,
  activeFontSize,
  onFontSizeChange,
  isKashidaEnabled,
  onToggleKashida,
  activeAlignment,
  onAlignmentChange,
}) => {
  return (
    <div className="studio-ribbon">
      {/* Undo / Redo / Commands Group */}
      <div className="ribbon-group">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`ribbon-tool-btn ${!canUndo ? 'disabled' : ''}`}
          title="منسوخ کریں (Undo Ctrl+Z)"
        >
          <span>↩</span>
          <span>Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`ribbon-tool-btn ${!canRedo ? 'disabled' : ''}`}
          title="دوبارہ کریں (Redo Ctrl+Y)"
        >
          <span>↪</span>
          <span>Redo</span>
        </button>

        <div className="ribbon-divider" />

        {/* Tools Selector */}
        <button
          onClick={() => onSelectTool('select')}
          className={`ribbon-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          title="انتخاب آلہ (Select Tool)"
        >
          <span>↖</span>
          <span>Select</span>
        </button>

        <button
          onClick={() => onSelectTool('text')}
          className={`ribbon-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          title="متن فریم (Text Frame Tool)"
        >
          <span>T</span>
          <span>Text Frame</span>
        </button>

        <button
          onClick={() => onSelectTool('rectangle')}
          className={`ribbon-tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
          title="مستطیل شکل (Rectangle Tool)"
        >
          <span>▭</span>
          <span>Shape</span>
        </button>

        <button
          onClick={() => onSelectTool('image')}
          className={`ribbon-tool-btn ${activeTool === 'image' ? 'active' : ''}`}
          title="تصویر فریم (Image Frame Tool)"
        >
          <AppIcon name="image" />
          <span>Image Frame</span>
        </button>
      </div>

      {/* Typography Quick Ribbon Controls */}
      <div className="ribbon-group dir-rtl">
        {/* Font Family */}
        <select
          value={activeFontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="ribbon-select"
          title="اردو رسم الخط (Urdu Font Family)"
        >
          <option value="Noto Nastaliq Urdu">نستعلیق (Noto Nastaliq)</option>
          <option value="Jameel Noori Nastaleeq">جمیل نوری نستعلیق</option>
          <option value="Gulzar">گلزار (Gulzar)</option>
          <option value="InPage Ali Nastaliq">انپیج علی نستعلیق</option>
          <option value="InPage Lahori Nastaliq">انپیج لاہوری نستعلیق</option>
        </select>

        {/* Font Size */}
        <input
          type="number"
          value={activeFontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="ribbon-number-input"
          min={8}
          max={144}
          title="فونٹ کا سائز (Font Size pt)"
        />

        {/* Kashida Tatweel Toggle */}
        <button
          onClick={onToggleKashida}
          className={`ribbon-tool-btn ${isKashidaEnabled ? 'active' : ''}`}
          title="کشیدہ کشش (Kashida Justification)"
        >
          <span>ـ</span>
          <span>کشیدہ</span>
        </button>

        {/* Alignment Controls */}
        <div className="ribbon-align-group">
          <button
            onClick={() => onAlignmentChange('start')}
            className={`ribbon-align-btn ${activeAlignment === 'start' ? 'active' : ''}`}
            title="دائیں (Right Alignment)"
          >
            Right
          </button>
          <button
            onClick={() => onAlignmentChange('center')}
            className={`ribbon-align-btn ${activeAlignment === 'center' ? 'active' : ''}`}
            title="مرکز (Center Alignment)"
          >
            Center
          </button>
          <button
            onClick={() => onAlignmentChange('justify')}
            className={`ribbon-align-btn ${activeAlignment === 'justify' ? 'active' : ''}`}
            title="برابر (Justify)"
          >
            Justify
          </button>
        </div>
      </div>
    </div>
  );
};
