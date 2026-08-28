import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCcw
} from 'lucide-react';

export const getPaymentBadge = (status, advanceAmount = null) => {
  switch(status) {
    case 'paid':
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
          <CheckCircle size={14} />
          Full Payment Done
        </span>
      );
    case 'pending':
      if (advanceAmount !== null && Number(advanceAmount) <= 0) {
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-1 rounded">
            <AlertCircle size={14} />
            Payment Required
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded">
          <Clock size={14} />
          Half Paid – Remaining on Board
        </span>
      );
    case 'failed':
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-1 rounded">
          <AlertCircle size={14} />
          Payment Failed
        </span>
      );
    case 'refunded':
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
          <RefreshCcw size={14} />
          Refunded
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1 rounded">
          <AlertCircle size={14} />
          {status || 'Unknown'}
        </span>
      );
  }
};

export const getStatusBadge = (status) => {
  switch(status) {
    case 'confirmed':
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
          <CheckCircle size={14} />
          Confirmed
        </span>
      );
    case 'completed':
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#01AFD1] bg-[#e0faff] px-2 py-1 rounded">
          <CheckCircle size={14} />
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-1 rounded">
          <XCircle size={14} />
          Cancelled
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded">
          <Clock size={14} />
          Pending
        </span>
      );
  }
};


