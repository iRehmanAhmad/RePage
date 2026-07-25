import React, { useEffect, useRef } from 'react';
import type { Page, PageObject, Rect } from '../../domain/document/types';
import { FabricCanvasAdapter } from '../../editor/canvas/fabricAdapter';

interface FabricCanvasProps {
  page: Page;
  objects: PageObject[];
  onObjectModified?: (objectId: string, frameProps: Partial<Rect>) => void;
  onSelectionChanged?: (objectId: string | null) => void;
}

export function FabricCanvas({ page, objects, onObjectModified, onSelectionChanged }: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const adapterRef = useRef<FabricCanvasAdapter | null>(null);

  const callbacksRef = useRef({ onObjectModified, onSelectionChanged });
  useEffect(() => {
    callbacksRef.current = { onObjectModified, onSelectionChanged };
  }, [onObjectModified, onSelectionChanged]);

  // Attach fabric canvas on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const adapter = new FabricCanvasAdapter();
    adapter.attach(canvasRef.current, page.width, page.height, {
      onObjectModified: (id, frame) => callbacksRef.current.onObjectModified?.(id, frame),
      onSelectionChanged: (id) => callbacksRef.current.onSelectionChanged?.(id),
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

  // Synchronize objects on canvas when page objects change
  useEffect(() => {
    if (adapterRef.current) {
      adapterRef.current.syncObjects(objects);
    }
  }, [objects]);

  return (
    <div className="canvas-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
