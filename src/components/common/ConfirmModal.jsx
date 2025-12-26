import React from 'react';
import { Icon } from './index';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'ยืนยันการดำเนินการ',
  message = 'คุณแน่ใจหรือไม่?',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'warning', // warning, danger, info
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const typeIcons = {
    warning: 'warning',
    danger: 'delete',
    info: 'info',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-slide-up overflow-hidden">
        {/* Icon */}
        <div className="pt-6 pb-4 flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${typeStyles[type]}`}>
            <Icon name={typeIcons[type]} className="text-3xl" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-4 text-primary font-bold hover:bg-primary/5 transition-colors border-l border-gray-100"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
