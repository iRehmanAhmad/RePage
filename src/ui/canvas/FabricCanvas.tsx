import React, { useEffect, useRef } from 'react';
import type { Page, PageObject, Rect } from '../../domain/document/types';
import { FabricCanvasAdapter } from '../../editor/canvas/fabricAdapter';

interface FabricCanvasProps {
  page: Page;
  objects: PageObject[];
  stories?: Record<string, import('../../domain/document/types').TextStory> | undefined;
  selectedObjectId?: string | null | undefined;
  onObjectModified?: (objectId: string, frameProps: Partial<Rect>) => void;
  onSelectionChanged?: (objectId: string | null) => void;
  onObjectDoubleClicked?: (objectId: string) => void;
  onBlankCanvasClick?: () => void;
}

export function FabricCanvas({
  page,
  objects,
  stories,
  selectedObjectId,
  onObjectModified,
  onSelectionChanged,
  onObjectDoubleClicked,
  onBlankCanvasClick,
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const adapterRef = useRef<FabricCanvasAdapter | null>(null);

  const callbacksRef = useRef({ onObjectModified, onSelectionChanged, onObjectDoubleClicked, onBlankCanvasClick });
  useEffect(() => {
    callbacksRef.current = { onObjectModified, onSelectionChanged, onObjectDoubleClicked, onBlankCanvasClick };
  }, [onObjectModified, onSelectionChanged, onObjectDoubleClicked, onBlankCanvasClick]);

  // Attach fabric canvas on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const adapter = new FabricCanvasAdapter();
    adapter.attach(canvasRef.current, page.width, page.height, {
      onObjectModified: (id, frame) => callbacksRef.current.onObjectModified?.(id, frame),
      onSelectionChanged: (id) => callbacksRef.current.onSelectionChanged?.(id),
      onObjectDoubleClicked: (id) => callbacksRef.current.onObjectDoubleClicked?.(id),
      onBlankCanvasClick: () => callbacksRef.current.onBlankCanvasClick?.(),
    });

    adapterRef.current = adapter;

    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [page.width, page.height]);

  // Update canvas dimensions when page size changes
  useEffect(() => {
    if (adapterRef.current) {
      adapterRef.current.resizeCanvas(page.width, page.height);
    }
  }, [page.width, page.height]);

  // Synchronize objects on canvas when page objects, stories, or selected object change
  useEffect(() => {
    if (adapterRef.current) {
      adapterRef.current.syncObjects(objects, stories, selectedObjectId);
    }
  }, [objects, stories, selectedObjectId]);

  return (
    <div className="canvas-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
