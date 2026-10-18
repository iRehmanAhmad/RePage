import React from 'react';
import { AppIcon } from '../icons/AppIcon';
import { DICTIONARY, type Translations } from '../i18n/menuTranslation';

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
  t?: Translations;
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
  t,
}) => {
  const tt = t ?? DICTIONARY.en;
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
          <AppIcon name="undo" />
          <span>{tt.undo}</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`ribbon-tool-btn ${!canRedo ? 'disabled' : ''}`}
          title="دوبارہ کریں (Redo Ctrl+Y)"
        >
          <AppIcon name="redo" />
          <span>{tt.redo}</span>
        </button>

        <div className="ribbon-divider" />

        {/* Tools Selector */}
        <button
          onClick={() => onSelectTool('select')}
          className={`ribbon-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          title="انتخاب آلہ (Select Tool)"
        >
          <AppIcon name="target" />
          <span>{tt.select}</span>
        </button>

        <button
          onClick={() => onSelectTool('text')}
          className={`ribbon-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          title="متن فریم (Text Frame Tool)"
        >
          <span>T</span>
          <span>{tt.textFrame}</span>
        </button>

        <button
          onClick={() => onSelectTool('rectangle')}
          className={`ribbon-tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
          title="مستطیل شکل (Rectangle Tool)"
        >
          <AppIcon name="square" />
          <span>{tt.shape}</span>
        </button>

        <button
          onClick={() => onSelectTool('image')}
          className={`ribbon-tool-btn ${activeTool === 'image' ? 'active' : ''}`}
          title="تصویر فریم (Image Frame Tool)"
        >
          <AppIcon name="image" />
          <span>{tt.imageFrame}</span>
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
          <span>{tt.kashida}</span>
        </button>

        {/* Alignment Controls */}
        <div className="ribbon-align-group">
          <button
            onClick={() => onAlignmentChange('start')}
            className={`ribbon-align-btn ${activeAlignment === 'start' ? 'active' : ''}`}
            title="دائیں (Right Alignment)"
          >
            {tt.alignRight}
          </button>
          <button
            onClick={() => onAlignmentChange('center')}
            className={`ribbon-align-btn ${activeAlignment === 'center' ? 'active' : ''}`}
            title="مرکز (Center Alignment)"
          >
            {tt.alignCenter}
          </button>
          <button
            onClick={() => onAlignmentChange('justify')}
            className={`ribbon-align-btn ${activeAlignment === 'justify' ? 'active' : ''}`}
            title="برابر (Justify)"
          >
            {tt.alignJustify}
          </button>
        </div>
      </div>
    </div>
  );
};
