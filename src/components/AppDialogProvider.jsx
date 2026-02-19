import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './AppDialogProvider.css';

const DialogContext = createContext(null);

export function AppDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const clearDialog = useCallback((value) => {
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
    setDialog(null);
  }, []);

  const alertDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        type: 'alert',
        title: options.title || 'Notice',
        message: String(message || ''),
        confirmText: options.confirmText || 'OK',
        cancelText: '',
        tone: options.tone || 'primary',
      });
    });
  }, []);

  const confirmDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        type: 'confirm',
        title: options.title || 'Confirm Action',
        message: String(message || ''),
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        tone: options.tone || 'primary',
      });
    });
  }, []);

  const value = useMemo(() => ({
    alert: alertDialog,
    confirm: confirmDialog,
  }), [alertDialog, confirmDialog]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="app-dialog-overlay" onClick={() => clearDialog(dialog.type === 'confirm' ? false : true)}>
          <div className="app-dialog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="app-dialog-head">
              <h3>{dialog.title}</h3>
            </div>
            <div className="app-dialog-body">
              <p>{dialog.message}</p>
            </div>
            <div className="app-dialog-actions">
              {dialog.type === 'confirm' && (
                <button
                  type="button"
                  className="app-dialog-btn app-dialog-btn-secondary"
                  onClick={() => clearDialog(false)}
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                className={`app-dialog-btn ${dialog.tone === 'danger' ? 'app-dialog-btn-danger' : 'app-dialog-btn-primary'}`}
                onClick={() => clearDialog(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used within AppDialogProvider.');
  }
  return ctx;
}

