import { useEffect } from 'react';
import { useStudioStore } from '../stores/useStudioStore';
import { quickSavePdf, quickSaveEditablePdf } from '../services/documentActions';

function isTypingContext(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'MATH-FIELD') {
    return true;
  }
  if (el.isContentEditable) return true;
  if (el.closest && el.closest('math-field')) return true;
  return false;
}

export function useKeyboardShortcuts(onTriggerOpenFile: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const state = useStudioStore.getState();
      const activeDoc = state.documents.find((d) => d.id === state.activeDocId) || null;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Escape always works
      if (e.key === 'Escape') {
        if (state.activeModal) {
          state.setActiveModal(null);
          return;
        }
        if (state.isFullscreen) {
          state.setIsFullscreen(false);
          return;
        }
        state.selectObjects([]);
        state.setActiveTool('select');
        return;
      }

      // Modifier shortcuts
      if (mod) {
        if (key === 'o') {
          e.preventDefault();
          onTriggerOpenFile();
          return;
        }
        if (key === 's' && activeDoc) {
          e.preventDefault();
          if (e.shiftKey) {
            quickSaveEditablePdf(activeDoc);
          } else {
            quickSavePdf(activeDoc, false);
          }
          return;
        }
        if (key === 'p' && activeDoc) {
          e.preventDefault();
          state.setActiveModal('print');
          return;
        }
        if (key === 'z' && activeDoc && !isTypingContext(e.target)) {
          e.preventDefault();
          if (e.shiftKey) state.redo();
          else state.undo();
          return;
        }
        if (key === 'c' && activeDoc && !isTypingContext(e.target) && state.selectedObjectIds.length > 0) {
          e.preventDefault();
          state.copySelected();
          return;
        }
        if (key === 'v' && activeDoc && !isTypingContext(e.target) && state.clipboardObjects.length > 0) {
          e.preventDefault();
          state.pasteClipboard();
          return;
        }
        if ((key === 'f' || key === 'h') && activeDoc) {
          e.preventDefault();
          state.setActiveModal('find-replace');
          return;
        }
        return;
      }

      // Never trigger single-key shortcuts while typing or while a modal is open
      if (isTypingContext(e.target) || state.activeModal) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedObjectIds.length > 0) {
        e.preventDefault();
        state.deleteObjects(state.selectedObjectIds);
        return;
      }

      if (!activeDoc) return;

      if (key === 'q') state.setActiveTool('select');
      else if (key === 'w') state.setActiveTool('hand');
      else if (key === 'e') {
        state.setRibbonTab('edit');
        state.setActiveTool('edit-text');
      } else if (key === 't') {
        state.setRibbonTab('edit');
        state.setActiveTool('add-text');
      } else if (key === 'm') {
        state.setRibbonTab('formula');
        state.setActiveTool('formula');
      } else if (key === 'p') {
        state.setRibbonTab('annotate');
        state.setActiveTool('pen');
      } else if (key === 'g') {
        state.setRibbonTab('grade');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onTriggerOpenFile]);
}
