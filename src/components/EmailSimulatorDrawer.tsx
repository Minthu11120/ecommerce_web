import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Clock, Eye, Code, ExternalLink } from 'lucide-react';
import { EmailNotification, Language } from '../types';
import { translations } from '../data/translations';

interface EmailSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  emails: EmailNotification[];
  language: Language;
  onSelectOrderTracking: (orderId: string) => void;
}

export const EmailSimulatorDrawer: React.FC<EmailSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  emails,
  language,
  onSelectOrderTracking,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(emails[0] || null);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="drawer-emails"
          className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold font-serif text-white">
                  {t.emailDrawer.title}
                </h2>
                <p className="text-xs text-stone-400">{t.emailDrawer.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-stone-800 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Two columns or master-detail */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Email List Left */}
            <div className="w-full md:w-5/12 border-r border-stone-200 overflow-y-auto divide-y divide-stone-100 bg-stone-50">
              {emails.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  {t.emailDrawer.noEmails}
                </div>
              ) : (
                emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 cursor-pointer transition-colors text-xs ${
                      selectedEmail?.id === email.id
                        ? 'bg-white border-l-4 border-amber-800 shadow-xs'
                        : 'hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-stone-800 uppercase text-[10px] tracking-wider">
                        {email.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">{email.sentAt}</span>
                    </div>
                    <div className="font-semibold text-stone-900 line-clamp-1">
                      {language === 'mm' ? email.subjectMm : email.subject}
                    </div>
                    <p className="text-stone-500 line-clamp-2 mt-1 text-[11px] leading-relaxed">
                      {email.preview}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Email Preview Detail Right */}
            <div className="w-full md:w-7/12 flex-1 flex flex-col justify-between overflow-y-auto p-4 bg-stone-100/60">
              {selectedEmail ? (
                <div className="space-y-3">
                  {/* Mode switch */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-stone-200 text-xs">
                    <div>
                      <span className="text-stone-500">To:</span>{' '}
                      <strong className="text-stone-800 font-mono">{selectedEmail.recipientEmail}</strong>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                          viewMode === 'preview' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Eye className="w-3 h-3" /> {language === 'mm' ? 'ပြေစာပုံစံ' : 'Receipt View'}
                      </button>
                      <button
                        onClick={() => setViewMode('html')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                          viewMode === 'html' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Code className="w-3 h-3" /> {language === 'mm' ? 'စာသားပုံစံ' : 'Text'}
                      </button>
                    </div>
                  </div>

                  {/* Rendered HTML */}
                  {viewMode === 'preview' ? (
                    <div
                      className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    />
                  ) : (
                    <pre className="p-3 bg-stone-900 text-amber-200 font-mono text-[11px] rounded-lg overflow-x-auto max-h-96">
                      {selectedEmail.htmlContent}
                    </pre>
                  )}

                  {/* Action to track package directly */}
                  {selectedEmail.orderId && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectOrderTracking(selectedEmail.orderId);
                      }}
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {language === 'mm'
                          ? `အော်ဒါ #${selectedEmail.orderId} အခြေအနေ ခြေရာခံမည်`
                          : `Track Order #${selectedEmail.orderId}`}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-stone-400 text-xs">
                  {language === 'mm'
                    ? 'အသေးစိတ်ကြည့်ရှုရန် အကြောင်းကြားချက်တစ်ခုကို ရွေးချယ်ပါ'
                    : 'Select an email notification to preview your receipt.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
