import React, { useState, useEffect, useRef } from 'react';
import type {
  DocumentItem,
  DocumentType,
  DocumentStatus,
  ClientEntry,
  Conversation,
  ChatMessage,
  DocumentTemplate,
  DocumentBlock,
  DocumentSignature,
  DocumentPayment,
} from '../../types/dashboard';
import defaultDocumentsData from '../../data/documents.json';
import defaultDocumentTemplates from '../../data/documentTemplates.json';

interface DocumentsSectionProps {
  clients?: ClientEntry[];
  documents?: DocumentItem[];
  setDocuments?: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  conversations?: Conversation[];
  setConversations?: React.Dispatch<React.SetStateAction<Conversation[]>>;
  onSendDocumentToClient?: (doc: DocumentItem) => void;
  currentUserRole?: 'coach' | 'client';
}

const SESSION_DOCS_KEY = 'cadence_session_documents';
const SESSION_TEMPLATES_KEY = 'cadence_session_doc_templates';

export default function DocumentsSection({
  clients = [],
  documents: propsDocuments,
  setDocuments: propsSetDocuments,
  setConversations,
  onSendDocumentToClient: propsOnSendToClient,
  currentUserRole = 'coach',
}: DocumentsSectionProps) {
  // Session storage sync for Documents
  const [internalDocs, setInternalDocs] = useState<DocumentItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_DOCS_KEY);
      if (stored) return JSON.parse(stored) as DocumentItem[];
    } catch {}
    return defaultDocumentsData as DocumentItem[];
  });

  const documents = propsDocuments || internalDocs;
  const setDocuments = propsSetDocuments || setInternalDocs;

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_DOCS_KEY, JSON.stringify(documents));
    } catch {}
  }, [documents]);

  // Session storage sync for Templates
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_TEMPLATES_KEY);
      if (stored) return JSON.parse(stored) as DocumentTemplate[];
    } catch {}
    return defaultDocumentTemplates as DocumentTemplate[];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_TEMPLATES_KEY, JSON.stringify(templates));
    } catch {}
  }, [templates]);

  // Main View: 'list' | 'editor'
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');

  // Filters & Search for List View
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');

  // Toast notification
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

  // Hidden File Input for Word/Docx import
  const wordFileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Document Studio State (Dark Theme Matching Cadence) ──
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('New Quotation');
  const [docType, setDocType] = useState<DocumentType>('contract');
  const [docClient, setDocClient] = useState<ClientEntry | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'design' | 'link' | 'templates'>('design');
  const [accentColor, setAccentColor] = useState('#e85a2b');
  const [selectedFont, setSelectedFont] = useState('Space Grotesk');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showHelp, setShowHelp] = useState(false);

  // ── Auto-Save State & Refs ──
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Template Modals State ──
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTmplName, setSaveTmplName] = useState('');
  const [saveTmplCategory, setSaveTmplCategory] = useState('Retainers');
  const [saveTmplDesc, setSaveTmplDesc] = useState('');
  const [saveTmplType, setSaveTmplType] = useState<DocumentType>('contract');

  const [showLoadTemplatesModal, setShowLoadTemplatesModal] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [templateSearch, setTemplateSearch] = useState('');

  // ── Digital Signature & Legal Execution State ──
  const [activeDocSignature, setActiveDocSignature] = useState<DocumentSignature | undefined>(undefined);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingDoc, setSigningDoc] = useState<DocumentItem | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState<'client' | 'coach'>('client');
  const [sigMode, setSigMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSigText, setTypedSigText] = useState('');
  const [selectedSigFont, setSelectedSigFont] = useState<'Great Vibes' | 'Sacramento' | 'Caveat' | 'Dancing Script'>('Great Vibes');
  const [drawnSigData, setDrawnSigData] = useState<string | null>(null);
  const [uploadedSigData, setUploadedSigData] = useState<string | null>(null);
  const [penColor, setPenColor] = useState('#ffffff');
  const [legalConsentChecked, setLegalConsentChecked] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // ── Payment & Stripe Vault State ──
  const [activeDocPayment, setActiveDocPayment] = useState<DocumentPayment | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingDoc, setPayingDoc] = useState<DocumentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'ach' | 'on_file'>('card');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 8820 9140 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardZip, setCardZip] = useState('94105');
  const [saveCardChecked, setSaveCardChecked] = useState(true);
  const [achRouting, setAchRouting] = useState('121000358');
  const [achAccount, setAchAccount] = useState('8829104910');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<DocumentPayment | null>(null);

  // Interactive Content Blocks on the Document Canvas
  const [blocks, setBlocks] = useState<DocumentBlock[]>([
    {
      id: 'b1',
      type: 'heading',
      content: 'CADENCE 1-ON-1 HIGH PERFORMANCE COACHING',
    },
    {
      id: 'b2',
      type: 'box',
      content: 'Personalized athletic periodization and nutritional engineering protocol. Tailored to dynamic biometric telemetry.',
    },
    {
      id: 'b3',
      type: 'text',
      content:
        'This agreement outlines the customized physiological, nutritional, and metabolic periodization protocol provided by Coach Vance (Cadence Athletics). All recommendations are individualized based on real-time biometric telemetry.',
    },
    {
      id: 'b4',
      type: 'pricing',
      items: [
        { desc: 'Tier 1 Performance Retainer (Monthly Protocol)', qty: 1, rate: 1800, total: 1800 },
        { desc: 'Continuous Glucose Monitoring & Lab Biomarker Review', qty: 1, rate: 0, total: 0 },
        { desc: 'Weekly 1-on-1 Strategy Video Consultation & Clinical HUD', qty: 4, rate: 0, total: 0 },
      ],
    },
    {
      id: 'b5',
      type: 'payment',
      content:
        'Payment Schedule: Automated monthly debit via Stripe Vault on the 1st of each calendar month. Either party may adjust or terminate retainer with 30-day written notice.',
    },
  ]);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<DocumentBlock[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newBlocks: DocumentBlock[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setBlocks(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setBlocks(history[nextIdx]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── CORE SAVE FUNCTION (USED BY AUTO-SAVE, MANUAL SAVE & SHARE LINK) ──
  // ═══════════════════════════════════════════════════════════════════════════
  const executeSave = (sendToClient: boolean = false, showToast: boolean = false): DocumentItem => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setSaveStatus('saving');

    const clientName = docClient?.name || 'General / Unlinked';
    const clientId = docClient?.id || 'c1';

    let calculatedAmount = '$1,800/mo';
    const pricingBlock = blocks.find((b) => b.type === 'pricing');
    if (pricingBlock?.items && pricingBlock.items.length > 0) {
      const sum = pricingBlock.items.reduce((acc, curr) => acc + curr.total, 0);
      calculatedAmount = `$${sum.toLocaleString()}/mo`;
    }

    const documentContent = blocks
      .map((b) => (b.content ? b.content : b.type === 'pricing' ? 'Pricing Schedule Included' : ''))
      .filter(Boolean)
      .join('\n\n');

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let targetDocId = activeDocId;

    if (!targetDocId) {
      targetDocId = 'doc_' + Date.now();
      setActiveDocId(targetDocId);
    }

    const savedDoc: DocumentItem = {
      id: targetDocId,
      name: docTitle.trim() || 'Untitled Quotation',
      type: docType,
      client: clientName,
      clientId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: activeDocPayment ? 'paid' : (activeDocSignature ? 'signed' : (sendToClient ? 'sent' : 'draft')),
      size: `${Math.max(48, Math.round(JSON.stringify(blocks).length / 28))} KB`,
      amount: calculatedAmount,
      content: documentContent,
      blocks: JSON.parse(JSON.stringify(blocks)),
      accentColor,
      selectedFont,
      updatedAt: nowTime,
      lastSentAt: sendToClient ? 'Just now' : undefined,
      signature: activeDocSignature,
      payment: activeDocPayment,
    };

    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === targetDocId);
      const updatedList = exists
        ? prev.map((d) => (d.id === targetDocId ? { ...d, ...savedDoc } : d))
        : [savedDoc, ...prev];
      try {
        sessionStorage.setItem(SESSION_DOCS_KEY, JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });

    setSaveStatus('saved');
    setLastSavedTime(nowTime);
    isDirtyRef.current = false;

    if (sendToClient) {
      handleSendDocToClient(savedDoc);
    } else if (showToast) {
      setSendSuccessToast(`✓ Document "${savedDoc.name}" saved to vault!`);
      setTimeout(() => setSendSuccessToast(null), 3000);
    }

    return savedDoc;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 2-SECOND DEBOUNCED AUTO-SAVE EFFECT ──
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (currentView !== 'editor') return;

    // Skip the very first mount of the editor view (no user edits yet)
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    isDirtyRef.current = true;
    setSaveStatus('unsaved');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Auto-save after exactly 2 seconds (2000ms) of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        executeSave(false, false);
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [docTitle, blocks, docType, docClient, accentColor, selectedFont, currentView]);

  // ── KEYBOARD SHORTCUT: Ctrl+S / Cmd+S FOR INSTANT SAVE ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        if (currentView === 'editor') {
          e.preventDefault();
          executeSave(false, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, docTitle, blocks, docType, docClient, accentColor, selectedFont, activeDocId]);

  // Navigation back to Documents: immediately flush any pending auto-save
  const handleBackToDocuments = () => {
    if (isDirtyRef.current) {
      executeSave(false, false);
    }
    setCurrentView('list');
  };

  // Open Editor for New Document
  const handleOpenNewDocument = () => {
    const defaultClient = clients[0] || null;
    const newId = 'doc_' + Date.now();
    setActiveDocId(newId);
    setActiveDocSignature(undefined);
    setActiveDocPayment(undefined);
    const newTitle = defaultClient ? `${defaultClient.name} — Coaching Agreement` : 'New Client Retainer';
    setDocTitle(newTitle);
    setDocType('proposal');
    setDocClient(defaultClient);
    setAccentColor('#e85a2b');
    setSelectedFont('Space Grotesk');

    const initialBlocks: DocumentBlock[] = [
      {
        id: 'b1',
        type: 'heading',
        content: defaultClient ? `${defaultClient.name.toUpperCase()} — HIGH PERFORMANCE COACHING` : 'CADENCE 1-ON-1 HIGH PERFORMANCE COACHING',
      },
      {
        id: 'b2',
        type: 'box',
        content: `Personalized athletic periodization and nutritional engineering. Client: ${defaultClient?.name || 'Client'} · Tier: ${defaultClient?.tierLabel || 'Tier 1 Protocol'}`,
      },
      {
        id: 'b3',
        type: 'text',
        content:
          'Thank you for your commitment to elite performance. Below is the proposed coaching framework and retainer terms for the upcoming training cycle. All macronutrient architectures are adjusted dynamically against real-time biometric telemetry.',
      },
      {
        id: 'b4',
        type: 'pricing',
        items: [
          {
            desc: defaultClient ? `${defaultClient.tierLabel || 'Tier 1 Protocol'} Monthly Retainer` : 'Tier 1 Performance Retainer',
            qty: 1,
            rate: defaultClient?.monthlyFeeNum || 1800,
            total: defaultClient?.monthlyFeeNum || 1800,
          },
          { desc: 'Continuous Glucose Monitoring (CGM) & Lab Biomarker Review', qty: 1, rate: 0, total: 0 },
          { desc: 'Weekly 1-on-1 Strategy Video Consultation & Clinical HUD', qty: 4, rate: 0, total: 0 },
        ],
      },
      {
        id: 'b5',
        type: 'payment',
        content: 'Billed monthly via Stripe Vault auto-debit on the 1st of each calendar month. 30-day written notice required for cancellation or tier adjustment.',
      },
    ];

    setBlocks(initialBlocks);
    setHistory([initialBlocks]);
    setHistoryIndex(0);

    const newDoc: DocumentItem = {
      id: newId,
      name: newTitle,
      type: 'proposal',
      client: defaultClient?.name || 'General / Unlinked',
      clientId: defaultClient?.id || 'c1',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'draft',
      size: '64 KB',
      amount: `$${(defaultClient?.monthlyFeeNum || 1800).toLocaleString()}/mo`,
      content: initialBlocks.map((b) => b.content || '').filter(Boolean).join('\n\n'),
      blocks: initialBlocks,
      accentColor: '#e85a2b',
      selectedFont: 'Space Grotesk',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setDocuments((prev) => {
      const updated = [newDoc, ...prev];
      try {
        sessionStorage.setItem(SESSION_DOCS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    isFirstMountRef.current = true;
    isDirtyRef.current = false;
    setSaveStatus('saved');
    setLastSavedTime(newDoc.updatedAt || 'Just now');
    setCurrentView('editor');
  };

  // Open Editor for Existing Document
  const handleOpenExistingDoc = (doc: DocumentItem) => {
    setActiveDocId(doc.id);
    setActiveDocSignature(doc.signature);
    setActiveDocPayment(doc.payment);
    setDocTitle(doc.name);
    setDocType(doc.type);
    const matchedClient = clients.find((c) => c.name.toLowerCase() === doc.client.toLowerCase()) || null;
    setDocClient(matchedClient);
    if (doc.accentColor) setAccentColor(doc.accentColor);
    if (doc.selectedFont) setSelectedFont(doc.selectedFont);

    let docBlocks: DocumentBlock[];
    if (doc.blocks && doc.blocks.length > 0) {
      docBlocks = JSON.parse(JSON.stringify(doc.blocks));
    } else {
      const feeNum = parseInt(doc.amount?.replace(/[^0-9]/g, '') || '1800', 10);
      docBlocks = [
        {
          id: 'b1',
          type: 'heading',
          content: doc.name.toUpperCase(),
        },
        {
          id: 'b2',
          type: 'box',
          content: doc.notes || `Official Cadence ${doc.type.toUpperCase()} · Authorized Client: ${doc.client}`,
        },
        {
          id: 'b3',
          type: 'text',
          content: doc.content || 'Coaching Agreement details and biometric protocol scope.',
        },
        {
          id: 'b4',
          type: 'pricing',
          items: [
            {
              desc: `${doc.name} (Retainer Fee)`,
              qty: 1,
              rate: feeNum,
              total: feeNum,
            },
            {
              desc: 'Biometric Telemetry HUD & Daily Glucose Review',
              qty: 1,
              rate: 0,
              total: 0,
            },
          ],
        },
        {
          id: 'b5',
          type: 'payment',
          content: `Payment Terms: Auto-debited on the 1st of each month via Stripe Vault. Status: ${doc.status.toUpperCase()}.`,
        },
      ];
    }

    setBlocks(docBlocks);
    setHistory([docBlocks]);
    setHistoryIndex(0);
    isFirstMountRef.current = true;
    isDirtyRef.current = false;
    setSaveStatus('saved');
    setLastSavedTime(doc.updatedAt || 'Synced');
    setCurrentView('editor');
  };

  // ── Block Tool Actions ──
  const handleAddBlock = (type: DocumentBlock['type']) => {
    const newId = 'b_' + Date.now();
    let newBlock: DocumentBlock;

    switch (type) {
      case 'heading':
        newBlock = { id: newId, type: 'heading', content: 'Section Heading' };
        break;
      case 'text':
        newBlock = { id: newId, type: 'text', content: 'Click here to write your custom contract clause or notes...' };
        break;
      case 'pricing':
        newBlock = {
          id: newId,
          type: 'pricing',
          items: [
            { desc: 'Coaching Package Item', qty: 1, rate: 1200, total: 1200 },
            { desc: 'Biometric Telemetry Monitoring', qty: 1, rate: 0, total: 0 },
          ],
        };
        break;
      case 'payment':
        newBlock = {
          id: newId,
          type: 'payment',
          content: 'Payment Terms: 100% upfront or monthly subscription via Stripe Auto-Debit on the 1st of each calendar month.',
        };
        break;
      case 'table':
        newBlock = {
          id: newId,
          type: 'table',
          content: 'Biomarker / Target Parameters',
          tableData: {
            headers: ['Metric / Biometric', 'Current Baseline', 'Target Threshold', 'Protocol Timing'],
            rows: [
              ['Fasting Blood Glucose', '104 mg/dL', '78 - 92 mg/dL', 'AM Waking CGM'],
              ['Resting Heart Rate (RHR)', '64 bpm', '52 - 56 bpm', 'Continuous Sensor'],
              ['Carbohydrate Re-Feed Buffer', '150g', '350g', 'Post-Heavy Lift Day'],
            ],
          },
        };
        break;
      case 'divider':
        newBlock = { id: newId, type: 'divider' };
        break;
      case 'box':
        newBlock = {
          id: newId,
          type: 'box',
          content: 'Important Client Note: All protocols require active morning fasting blood glucose and resting HR logs.',
        };
        break;
      case 'image':
        newBlock = {
          id: newId,
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
          imageCaption: 'Figure 1: Biometric Periodization & Telemetry Progression Schedule',
        };
        break;
      default:
        newBlock = { id: newId, type: 'text', content: 'New block' };
    }

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    pushHistory(updated);
  };

  const handleUpdateBlockContent = (id: string, newContent: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: newContent } : b))
    );
  };

  const handleUpdateBlockCaption = (id: string, newCaption: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, imageCaption: newCaption } : b))
    );
  };

  const handleUpdateBlockImageUrl = (id: string, newUrl: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, imageUrl: newUrl } : b))
    );
  };

  // ── Pricing Block Inline Editing Actions ──
  const handleUpdatePricingItem = (
    blockId: string,
    itemIdx: number,
    field: 'desc' | 'qty' | 'rate',
    value: string | number
  ) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.items) {
          const newItems = b.items.map((it, idx) => {
            if (idx === itemIdx) {
              const updated = { ...it, [field]: value };
              updated.total = (updated.qty || 1) * (updated.rate || 0);
              return updated;
            }
            return it;
          });
          return { ...b, items: newItems };
        }
        return b;
      })
    );
  };

  const handleAddPricingItem = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.items) {
          return {
            ...b,
            items: [...b.items, { desc: 'Performance Consultation / Protocol Module', qty: 1, rate: 350, total: 350 }],
          };
        }
        return b;
      })
    );
  };

  const handleDeletePricingItem = (blockId: string, itemIdx: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.items) {
          return {
            ...b,
            items: b.items.filter((_, idx) => idx !== itemIdx),
          };
        }
        return b;
      })
    );
  };

  // ── Table Block Inline Editing Actions ──
  const handleAddTableRow = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.tableData) {
          return {
            ...b,
            tableData: {
              ...b.tableData,
              rows: [...b.tableData.rows, ['New Parameter', 'Baseline', 'Target', 'Daily']],
            },
          };
        }
        return b;
      })
    );
  };

  const handleDeleteTableRow = (blockId: string, rowIdx: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.tableData) {
          return {
            ...b,
            tableData: {
              ...b.tableData,
              rows: b.tableData.rows.filter((_, idx) => idx !== rowIdx),
            },
          };
        }
        return b;
      })
    );
  };

  const handleUpdateTableCell = (
    blockId: string,
    rowIdx: number,
    colIdx: number,
    newVal: string
  ) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.tableData) {
          const newRows = b.tableData.rows.map((row, rI) => {
            if (rI === rowIdx) {
              const updatedRow = [...row];
              updatedRow[colIdx] = newVal;
              return updatedRow;
            }
            return row;
          });
          return {
            ...b,
            tableData: {
              ...b.tableData,
              rows: newRows,
            },
          };
        }
        return b;
      })
    );
  };

  const handleUpdateTableHeader = (blockId: string, headerIdx: number, val: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.tableData) {
          const newHeaders = [...b.tableData.headers];
          newHeaders[headerIdx] = val;
          return {
            ...b,
            tableData: {
              ...b.tableData,
              headers: newHeaders,
            },
          };
        }
        return b;
      })
    );
  };

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    pushHistory(updated);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    setBlocks(updated);
    pushHistory(updated);
  };

  // AI Builder Action
  const handleAIBuilder = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      const clientName = docClient?.name || 'Elena Rostova';
      const tier = docClient?.tierLabel || 'Tier 1 Protocol';
      const fee = docClient?.monthlyRetainer || '$1,800/mo';

      setDocTitle(`${clientName} — 2026 High Performance Agreement`);
      const aiBlocks: DocumentBlock[] = [
        {
          id: 'b_ai_1',
          type: 'heading',
          content: `CADENCE PERFORMANCE RETAINER AGREEMENT — ${clientName.toUpperCase()}`,
        },
        {
          id: 'b_ai_2',
          type: 'box',
          content: `AI Generated Protocol · Client Tier: ${tier} · Biometric Cadence: Daily CGM & Sleep Telemetry`,
        },
        {
          id: 'b_ai_3',
          type: 'text',
          content: `1. PARTIES & SCOPE: Coach Vance agrees to provide comprehensive elite nutritional consulting, weekly metabolic plateau detection, carbohydrate re-feed buffer algorithms, and dedicated 45-minute weekly strategy video reviews.\n2. BIOMARKER ADHERENCE: ${clientName} agrees to log daily morning weight, fasting glucose, and subjective readiness scores within the Cadence Client App.\n3. RETAINER TERMS: Monthly subscription fee of ${fee} will be auto-debited on the 1st of each calendar month.`,
        },
        {
          id: 'b_ai_4',
          type: 'pricing',
          items: [
            { desc: `${tier} Retainer (Monthly Cadence)`, qty: 1, rate: parseInt(fee.replace(/[^0-9]/g, '') || '1800', 10), total: parseInt(fee.replace(/[^0-9]/g, '') || '1800', 10) },
            { desc: 'Comprehensive Functional Blood Chemistry Interpretation', qty: 1, rate: 0, total: 0 },
            { desc: 'Rapid 12-Hour Priority Asynchronous Cadence AI Messenger', qty: 1, rate: 0, total: 0 },
          ],
        },
        {
          id: 'b_ai_5',
          type: 'payment',
          content: `Automated Stripe charge authorized for ${fee}. 30-day notice required for cancellation or tier modifications.`,
        },
      ];

      setBlocks(aiBlocks);
      pushHistory(aiBlocks);
      setSaveStatus('saved');
      setSendSuccessToast('Cadence AI generated full contract & pricing structure!');
      setTimeout(() => setSendSuccessToast(null), 3500);
    }, 600);
  };

  // ── TEMPLATE ACTIONS: SAVE AS TEMPLATE ──
  const handleOpenSaveTemplateModal = () => {
    setSaveTmplName(docTitle || 'Custom Retainer Template');
    setSaveTmplCategory('Retainers');
    setSaveTmplDesc('Custom coaching template with pricing schedule and terms.');
    setSaveTmplType(docType);
    setShowSaveTemplateModal(true);
  };

  const handleConfirmSaveTemplate = () => {
    if (!saveTmplName.trim()) {
      alert('Please enter a template name.');
      return;
    }

    let calculatedAmount = '$1,800/mo';
    const pricingBlock = blocks.find((b) => b.type === 'pricing');
    if (pricingBlock?.items && pricingBlock.items.length > 0) {
      const sum = pricingBlock.items.reduce((acc, curr) => acc + curr.total, 0);
      calculatedAmount = `$${sum.toLocaleString()}/mo`;
    }

    const newTemplate: DocumentTemplate = {
      id: 'tmpl_' + Date.now(),
      name: saveTmplName.trim(),
      type: saveTmplType,
      category: saveTmplCategory,
      description: saveTmplDesc.trim() || 'Custom saved coaching template.',
      isPreset: false,
      createdAt: 'Custom Saved',
      defaultAmount: calculatedAmount,
      blocks: JSON.parse(JSON.stringify(blocks)),
    };

    setTemplates((prev) => [newTemplate, ...prev]);
    setShowSaveTemplateModal(false);
    setSendSuccessToast(`✓ Template "${newTemplate.name}" saved to templates vault!`);
    setTimeout(() => setSendSuccessToast(null), 3500);
  };

  // ── TEMPLATE ACTIONS: LOAD TEMPLATE ──
  const handleApplyTemplate = (tmpl: DocumentTemplate) => {
    const deepCopiedBlocks: DocumentBlock[] = JSON.parse(JSON.stringify(tmpl.blocks));
    setBlocks(deepCopiedBlocks);
    pushHistory(deepCopiedBlocks);
    setDocTitle(docClient ? `${docClient.name} — ${tmpl.name}` : tmpl.name);
    setDocType(tmpl.type);
    setShowLoadTemplatesModal(false);
    setSendSuccessToast(`✓ Loaded template "${tmpl.name}" into canvas!`);
    setTimeout(() => setSendSuccessToast(null), 3500);
  };

  const handleDeleteCustomTemplate = (tmplId: string) => {
    if (window.confirm('Delete this custom template?')) {
      setTemplates((prev) => prev.filter((t) => t.id !== tmplId));
      setSendSuccessToast('Template removed from library.');
      setTimeout(() => setSendSuccessToast(null), 3000);
    }
  };

  // Filter templates for Modal
  const filteredTemplates = templates.filter((t) => {
    const q = templateSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    const matchesCat =
      templateFilter === 'all'
        ? true
        : templateFilter === 'custom'
        ? !t.isPreset
        : t.category.toLowerCase() === templateFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // ── DOWNLOAD PDF ACTION ──
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${docTitle} - Cadence Performance</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            .header { border-bottom: 2px solid ${accentColor}; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            .brand { font-size: 24px; font-weight: bold; color: ${accentColor}; }
            .meta { font-size: 12px; color: #666; text-align: right; }
            h1, h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #111; }
            p { font-size: 13px; color: #333; margin-bottom: 16px; white-space: pre-wrap; }
            .box { background: #f8f8f8; border-left: 4px solid ${accentColor}; padding: 12px 16px; margin: 16px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th { background: #f0f0f0; text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 12px; }
            .footer { margin-top: 48px; border-top: 1px solid #ddd; padding-top: 24px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">CADENCE PERFORMANCE</div>
              <div style="font-size: 12px; color: #666;">High-Performance Nutrition & Biometric Periodization</div>
              <div style="font-size: 12px; color: #666;">Director: Coach Julian Vance</div>
            </div>
            <div class="meta">
              <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
              <div><strong>Client:</strong> ${docClient?.name || 'Client'}</div>
              <div><strong>Ref:</strong> CAD-${Math.floor(1000 + Math.random() * 9000)}</div>
            </div>
          </div>
          ${blocks
            .map((b) => {
              if (b.type === 'heading') return `<h2>${b.content || ''}</h2>`;
              if (b.type === 'box') return `<div class="box">${b.content || ''}</div>`;
              if (b.type === 'pricing') {
                const rows = (b.items || [])
                  .map(
                    (i) =>
                      `<tr><td>${i.desc}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">$${i.rate.toLocaleString()}</td><td style="text-align:right">$${i.total.toLocaleString()}</td></tr>`
                  )
                  .join('');
                const sum = (b.items || []).reduce((acc, curr) => acc + curr.total, 0);
                return `<table><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total Retainer: $${sum.toLocaleString()} USD</div>`;
              }
              if (b.type === 'table') {
                const headers = (b.tableData?.headers || []).map((h) => `<th>${h}</th>`).join('');
                const rows = (b.tableData?.rows || [])
                  .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
                  .join('');
                return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
              }
              if (b.type === 'payment') return `<div class="box"><strong>Billing & Payment:</strong> ${b.content || ''}</div>`;
              if (b.type === 'divider') return `<hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />`;
              return `<p>${b.content || ''}</p>`;
            })
            .join('')}
          <div class="footer">
            <div>
              <div><strong>Coach Vance</strong></div>
              <div style="color:#666;">Julian Vance (Authorized Representative)</div>
              <div style="font-size:10px; color:#10b981; margin-top:2px;">✓ Digitally Certified · Cadence Vault</div>
            </div>
            <div>
              <div><strong>Client Digital Authorization</strong></div>
              ${activeDocSignature ? `
                <div style="color:#10b981; font-weight:bold; font-size:11px; margin-top:2px;">✓ Signed &amp; Legally Binding</div>
                ${activeDocSignature.signatureType === 'type'
                  ? `<div style="font-family:'Great Vibes', cursive; font-size:22px; color:#111; margin:4px 0;">${activeDocSignature.signatureData}</div>`
                  : `<img src="${activeDocSignature.signatureData}" style="max-height:40px; display:block; margin:4px 0;" />`
                }
                <div style="font-size:10px; color:#666;">Signed by ${activeDocSignature.signedBy} on ${activeDocSignature.signedAt}</div>
                <div style="font-size:9px; color:#888; font-family:monospace;">Certificate: ${activeDocSignature.certificateHash || 'CAD-SIGN-VERIFIED'}</div>
              ` : `
                <div style="color:#666;">${docClient?.name || 'Awaiting Signature'}</div>
                <div style="font-size:10px; color:#888; margin-top:2px;">Pending client e-signature execution</div>
              `}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
    setSendSuccessToast(`Generated printable view for "${docTitle}"!`);
    setTimeout(() => setSendSuccessToast(null), 3500);
  };

  // ── IMPORT WORD / DOCX FILE ACTION ──
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setDocTitle(fileName || 'Imported Agreement');

    const importedBlocks: DocumentBlock[] = [
      {
        id: 'b_imp_1',
        type: 'heading',
        content: `${fileName.toUpperCase()} — IMPORTED CONTRACT SCOPE`,
      },
      {
        id: 'b_imp_2',
        type: 'box',
        content: `Source File: ${file.name} (${Math.round(file.size / 1024) || 24} KB) · Parsed via Cadence Document Engine.`,
      },
      {
        id: 'b_imp_3',
        type: 'text',
        content: `1. APPLICABLE TERMS: All clauses from ${file.name} have been parsed into native Cadence interactive blocks. You may edit, reorder, or supplement these terms with real-time biometric metrics.\n2. ATHLETIC DELIVERABLES: Custom caloric targets, metabolic monitoring intervals, and weekly coach consults apply.\n3. CANCELLATION & PRORATION: Any modifications require 30-day written notice per standard terms.`,
      },
      {
        id: 'b_imp_4',
        type: 'pricing',
        items: [
          { desc: 'Imported Program Retainer (Monthly Execution)', qty: 1, rate: 1950, total: 1950 },
          { desc: 'Biometric Telemetry HUD & Lab Assessment', qty: 1, rate: 0, total: 0 },
        ],
      },
      {
        id: 'b_imp_5',
        type: 'payment',
        content: 'Standard automated billing applies on the 1st of each month via Stripe Vault.',
      },
    ];

    setBlocks(importedBlocks);
    pushHistory(importedBlocks);
    setSendSuccessToast(`✓ Imported "${file.name}" into document canvas!`);
    setTimeout(() => setSendSuccessToast(null), 3500);
  };

  // Send Document to Client
  const handleSendDocToClient = (doc: DocumentItem) => {
    if (propsOnSendToClient) {
      propsOnSendToClient(doc);
    } else {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, status: d.status === 'signed' ? 'signed' : 'sent', lastSentAt: 'Just now' }
            : d
        )
      );

      if (setConversations) {
        setConversations((prev) => {
          const existing = prev.find((c) => c.clientName.toLowerCase() === doc.client.toLowerCase());
          const newMsg: ChatMessage = {
            id: 'm_' + Date.now(),
            sender: 'coach',
            text: `Hello ${doc.client.split(' ')[0]}, I've generated and shared your document: "${doc.name}". Please review and confirm your acceptance.`,
            time: 'Just now',
            status: 'sent',
            attachment: {
              name: `${doc.name}.pdf`,
              size: doc.size || '98 KB',
              type: 'pdf',
            },
          };

          if (existing) {
            return prev.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    lastMessage: `Document shared: ${doc.name}`,
                    date: 'Just now',
                    messages: [...c.messages, newMsg],
                  }
                : c
            );
          }
          return prev;
        });
      }
    }

    setSendSuccessToast(`Link shared! Document dispatched directly to ${doc.client}.`);
    setTimeout(() => setSendSuccessToast(null), 4000);
  };

  // Delete Document
  const handleDeleteDoc = (docId: string) => {
    if (window.confirm('Delete this document from the vault?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDocId === docId) {
        setCurrentView('list');
      }
    }
  };

  // Duplicate / Clone Document
  const handleDuplicateDoc = (doc: DocumentItem) => {
    const clonedDoc: DocumentItem = {
      ...doc,
      id: 'doc_' + Date.now(),
      name: `${doc.name} (Copy)`,
      status: 'draft',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setDocuments((prev) => {
      const updated = [clonedDoc, ...prev];
      try {
        sessionStorage.setItem(SESSION_DOCS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSendSuccessToast(`✓ Duplicated "${doc.name}"!`);
    setTimeout(() => setSendSuccessToast(null), 3000);
  };

  // ── DIGITAL SIGNATURE & CANVAS HANDLERS ──
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setDrawnSigData(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSigData(null);
  };

  const handleOpenSignModalForDoc = (doc: DocumentItem) => {
    setSigningDoc(doc);
    setSignerName(doc.client || 'Client');
    setSignerRole('client');
    setSigMode('draw');
    setTypedSigText(doc.client || '');
    setDrawnSigData(doc.signature?.signatureType === 'draw' ? doc.signature.signatureData : null);
    setUploadedSigData(doc.signature?.signatureType === 'upload' ? doc.signature.signatureData : null);
    setLegalConsentChecked(false);
    setShowSignatureModal(true);
  };

  const handleOpenSignModalForCurrentDoc = () => {
    const currentDoc = documents.find((d) => d.id === activeDocId) || null;
    setSigningDoc(currentDoc);
    setSignerName(docClient?.name || 'Client');
    setSignerRole('client');
    setSigMode('draw');
    setTypedSigText(docClient?.name || 'Authorized Client');
    setDrawnSigData(activeDocSignature?.signatureType === 'draw' ? activeDocSignature.signatureData : null);
    setUploadedSigData(activeDocSignature?.signatureType === 'upload' ? activeDocSignature.signatureData : null);
    setLegalConsentChecked(false);
    setShowSignatureModal(true);
  };

  const handleApplySignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalConsentChecked) {
      alert('Please check the legal acknowledgment box to confirm your electronic signature.');
      return;
    }

    let finalSigData = '';
    if (sigMode === 'draw') {
      if (!drawnSigData) {
        alert('Please draw your signature on the signature pad.');
        return;
      }
      finalSigData = drawnSigData;
    } else if (sigMode === 'type') {
      if (!typedSigText.trim()) {
        alert('Please enter your full legal name for the typed signature.');
        return;
      }
      finalSigData = typedSigText.trim();
    } else if (sigMode === 'upload') {
      if (!uploadedSigData) {
        alert('Please select or upload a signature stamp.');
        return;
      }
      finalSigData = uploadedSigData;
    }

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const certHash = `CAD-SIGN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const newSignature: DocumentSignature = {
      signedBy: signerName.trim() || 'Authorized Representative',
      signedAt: nowStr,
      signatureType: sigMode,
      signatureData: finalSigData,
      certificateHash: certHash,
      ipAddress: 'Cadence Vault · 256-Bit Encrypted',
    };

    const targetId = signingDoc?.id || activeDocId;

    if (targetId) {
      setDocuments((prev) => {
        const updated = prev.map((d) =>
          d.id === targetId ? { ...d, status: 'signed' as DocumentStatus, signature: newSignature } : d
        );
        try {
          sessionStorage.setItem(SESSION_DOCS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    if (activeDocId && (!signingDoc || signingDoc.id === activeDocId)) {
      setActiveDocSignature(newSignature);
    }

    setShowSignatureModal(false);
    setSendSuccessToast(`✓ Document digitally signed and executed with certificate ${certHash}!`);
    setTimeout(() => setSendSuccessToast(null), 4000);
  };

  const renderSignatureModal = () => {
    if (!showSignatureModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fadeIn">
        <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ffb4a3]/20 flex items-center justify-center text-[#ffdad2]">
                <span className="material-symbols-outlined text-[18px]">draw</span>
              </div>
              <div>
                <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                  Digital Signature &amp; Authorization
                </h3>
                <p className="text-[11px] text-[#958ea0] font-sans truncate max-w-xs">
                  {signingDoc ? signingDoc.name : docTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSignatureModal(false)}
              className="text-[#958ea0] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form onSubmit={handleApplySignature} className="p-6 space-y-4 text-xs text-[#cbc3d7]">
            {/* Signer Identity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-space font-bold text-[11px] text-[#ffdad2] block mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => {
                    setSignerName(e.target.value);
                    if (sigMode === 'type') setTypedSigText(e.target.value);
                  }}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-sans"
                  required
                />
              </div>

              <div>
                <label className="font-space font-bold text-[11px] text-[#ffdad2] block mb-1">
                  Signing Capacity
                </label>
                <select
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value as 'client' | 'coach')}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-space"
                >
                  <option value="client">Client (Authorized Signee)</option>
                  <option value="coach">Coach (Julian Vance)</option>
                </select>
              </div>
            </div>

            {/* Mode Switcher: Draw | Type | Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-space font-bold text-[11px] text-[#ffdad2]">
                  Signature Creation Method
                </span>
                <span className="text-[10px] text-[#4edea3] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                  ESIGN &amp; UETA Compliant
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d0e12] rounded-xl border border-[#292a2e]">
                {(['draw', 'type', 'upload'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSigMode(mode)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-space font-bold capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      sigMode === mode
                        ? 'bg-[#ffb4a3] text-[#3a0900] shadow-sm'
                        : 'text-[#958ea0] hover:text-[#e3e2e8]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {mode === 'draw' ? 'gesture' : mode === 'type' ? 'text_fields' : 'cloud_upload'}
                    </span>
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MODE 1: DRAW CANVAS */}
            {sigMode === 'draw' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#958ea0]">
                  <span>Draw with mouse or fingertip:</span>
                  <div className="flex items-center gap-2">
                    {/* Color pills */}
                    <div className="flex items-center gap-1">
                      {[
                        { color: '#ffffff', label: 'White' },
                        { color: '#ffb4a3', label: 'Coral' },
                        { color: '#38bdf8', label: 'Navy' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setPenColor(c.color)}
                          style={{ backgroundColor: c.color }}
                          className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                            penColor === c.color ? 'scale-125 border-white' : 'border-transparent'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[#ff5449] hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">refresh</span>
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#0d0e12] border border-[#292a2e] rounded-xl overflow-hidden relative touch-none">
                  <canvas
                    ref={sigCanvasRef}
                    width={460}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[130px] cursor-crosshair block"
                  />
                  {!drawnSigData && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#4a4855] text-xs font-serif italic">
                      Sign on the line above
                    </div>
                  )}
                  <div className="absolute bottom-5 left-4 right-4 border-b border-[#292a2e]/40 pointer-events-none" />
                </div>
              </div>
            )}

            {/* MODE 2: TYPE IN CURSIVE */}
            {sigMode === 'type' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                    Signature Text
                  </label>
                  <input
                    type="text"
                    value={typedSigText}
                    onChange={(e) => setTypedSigText(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-sans"
                  />
                </div>

                {/* Font selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-space text-[#958ea0] block">
                    Choose Script Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { font: 'Great Vibes', sample: typedSigText || signerName || 'Sarah Jenkins' },
                      { font: 'Sacramento', sample: typedSigText || signerName || 'Sarah Jenkins' },
                      { font: 'Caveat', sample: typedSigText || signerName || 'Sarah Jenkins' },
                      { font: 'Dancing Script', sample: typedSigText || signerName || 'Sarah Jenkins' },
                    ].map((f) => (
                      <button
                        key={f.font}
                        type="button"
                        onClick={() => setSelectedSigFont(f.font as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedSigFont === f.font
                            ? 'bg-[#ffb4a3]/10 border-[#ffb4a3] text-[#ffdad2]'
                            : 'bg-[#0d0e12] border-[#292a2e] text-[#958ea0] hover:border-[#ffb4a3]/40 hover:text-[#e3e2e8]'
                        }`}
                      >
                        <span className="text-[9px] font-space text-[#958ea0] block mb-0.5">{f.font}</span>
                        <span style={{ fontFamily: `'${f.font}', cursive` }} className="text-lg italic truncate block">
                          {f.sample}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 3: UPLOAD */}
            {sigMode === 'upload' && (
              <div className="space-y-2">
                <label className="text-[11px] font-space text-[#958ea0] block">
                  Upload Transparent PNG / JPG Stamp
                </label>
                <div className="border border-dashed border-[#292a2e] rounded-xl p-4 text-center bg-[#0d0e12] hover:border-[#ffb4a3]/50 transition-colors">
                  {uploadedSigData ? (
                    <div className="space-y-2">
                      <img
                        src={uploadedSigData}
                        alt="Uploaded Signature"
                        className="max-h-16 mx-auto object-contain filter invert"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedSigData(null)}
                        className="text-[10px] text-[#ff5449] hover:underline cursor-pointer"
                      >
                        Remove &amp; upload different image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-2">
                      <span className="material-symbols-outlined text-2xl text-[#ffb4a3] block mb-1">
                        upload_file
                      </span>
                      <span className="text-xs font-space font-semibold text-[#e3e2e8] block">
                        Select signature image
                      </span>
                      <span className="text-[10px] text-[#958ea0] font-sans">
                        PNG or JPG up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setUploadedSigData(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Legal Consent Checkbox */}
            <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalConsentChecked}
                  onChange={(e) => setLegalConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[#292a2e] text-[#e85a2b] focus:ring-0 cursor-pointer"
                  required
                />
                <span className="text-[11px] text-[#cbc3d7] font-sans leading-relaxed">
                  I agree that this electronic signature is legally binding, valid, and enforceable under the United States ESIGN Act and UETA guidelines.
                </span>
              </label>

              <div className="flex items-center justify-between text-[10px] text-[#958ea0] font-mono pt-1 border-t border-[#292a2e]/40">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-[#4edea3]">lock</span>
                  <span>256-Bit SSL Vault Verification</span>
                </span>
                <span>SHA-256 Stamp Generated</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!legalConsentChecked}
                className="px-4 py-2 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>Apply Signature &amp; Finalize</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ── Payment Handlers ──
  const handleOpenPaymentModal = (doc?: DocumentItem) => {
    const targetDoc = doc || documents.find((d) => d.id === activeDocId) || null;
    setPayingDoc(targetDoc);
    setCardholderName(targetDoc?.client || (currentUserRole === 'client' ? 'Sarah Jenkins' : 'Client'));
    setPaymentMethod('card');
    setPaymentSuccessData(targetDoc?.payment || null);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDoc = payingDoc || documents.find((d) => d.id === activeDocId) || null;
    if (!targetDoc && !activeDocId) return;

    setIsProcessingPayment(true);

    setTimeout(() => {
      const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const txId = `ch_3M${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const rcptId = `RCPT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const currentPriceNum = blocks.find((b) => b.type === 'pricing')?.items?.reduce((acc, curr) => acc + curr.total, 0) || 0;
      const targetAmount = targetDoc?.amount && targetDoc.amount !== '$0' ? targetDoc.amount : (currentPriceNum > 0 ? `$${currentPriceNum.toLocaleString()}` : '$1,500');

      const newPayment: DocumentPayment = {
        paidAt: nowStr,
        amount: targetAmount,
        method: paymentMethod === 'on_file' ? 'card' : paymentMethod,
        cardLast4: paymentMethod === 'on_file' ? '7721' : (paymentMethod === 'card' ? cardNumber.replace(/\s+/g, '').slice(-4) : undefined),
        transactionId: txId,
        receiptNumber: rcptId,
        status: 'succeeded',
      };

      const targetId = targetDoc?.id || activeDocId;

      if (targetId) {
        setDocuments((prev) => {
          const updated = prev.map((d) =>
            d.id === targetId ? { ...d, status: 'paid' as DocumentStatus, payment: newPayment } : d
          );
          try {
            sessionStorage.setItem(SESSION_DOCS_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      if (activeDocId && (!targetDoc || targetDoc.id === activeDocId)) {
        setActiveDocPayment(newPayment);
      }

      setPaymentSuccessData(newPayment);
      setIsProcessingPayment(false);
      setSendSuccessToast(`✓ Payment of ${newPayment.amount} confirmed via Stripe Vault! Receipt #${rcptId}`);
      setTimeout(() => setSendSuccessToast(null), 5000);
    }, 1200);
  };

  const renderPaymentModal = () => {
    if (!showPaymentModal) return null;

    const currentDoc = payingDoc || documents.find((d) => d.id === activeDocId) || null;
    const currentPriceNum = blocks.find((b) => b.type === 'pricing')?.items?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    const targetAmount = currentDoc?.amount && currentDoc.amount !== '$0' ? currentDoc.amount : (currentPriceNum > 0 ? `$${currentPriceNum.toLocaleString()}` : '$1,500');
    const targetClient = currentDoc?.client || docClient?.name || (currentUserRole === 'client' ? 'Sarah Jenkins' : 'Client');
    const targetTitle = currentDoc?.name || docTitle || 'Cadence Coaching Agreement';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fadeIn">
        <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb4a3]/20 to-[#e85a2b]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffdad2]">
                <span className="material-symbols-outlined text-[20px]">
                  {paymentSuccessData ? 'verified' : 'credit_card'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-space font-bold text-[#e3e2e8] flex items-center gap-2">
                  <span>{paymentSuccessData ? 'Payment Receipt & Confirmation' : 'Stripe Vault Checkout'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#292a2e] text-[#4edea3] border border-[#4edea3]/30">
                    256-Bit SSL
                  </span>
                </h3>
                <p className="text-[11px] text-[#958ea0] font-sans">
                  {paymentSuccessData
                    ? 'Transaction settled and recorded in Cadence vault'
                    : 'Secure online payment for coaching retainers and protocol documents'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="w-8 h-8 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Modal Body */}
          {paymentSuccessData ? (
            /* ── SUCCESS RECEIPT VIEW ── */
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              <div className="text-center space-y-2 py-2">
                <div className="w-16 h-16 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(78,222,163,0.25)]">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h4 className="text-base font-space font-bold text-[#e3e2e8]">
                  Payment Authorized &amp; Settled
                </h4>
                <p className="text-xs text-[#958ea0] font-sans max-w-sm mx-auto">
                  Your transaction has been processed securely. The document has been stamped as paid in full.
                </p>
                <div className="text-2xl font-space font-extrabold text-[#4edea3] pt-1">
                  {paymentSuccessData.amount}
                </div>
              </div>

              {/* Receipt Details Card */}
              <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Document</span>
                  <span className="text-[#e3e2e8] font-sans font-medium text-right truncate max-w-[220px]">
                    {targetTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Client Name</span>
                  <span className="text-[#e3e2e8] font-sans font-medium">{targetClient}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Transaction ID</span>
                  <span className="text-[#ffdad2]">{paymentSuccessData.transactionId}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Receipt Number</span>
                  <span className="text-[#e3e2e8]">{paymentSuccessData.receiptNumber}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Timestamp</span>
                  <span className="text-[#e3e2e8]">{paymentSuccessData.paidAt}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Payment Method</span>
                  <span className="text-[#e3e2e8] uppercase">
                    {paymentSuccessData.method} {paymentSuccessData.cardLast4 ? `(•••• ${paymentSuccessData.cardLast4})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0] pt-2 border-t border-[#292a2e]/60">
                  <span>Vault Status</span>
                  <span className="text-[#4edea3] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    SUCCEEDED
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPDF();
                    setSendSuccessToast('✓ Payment Receipt & Document PDF generated!');
                  }}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#25262c] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Download Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ── CHECKOUT FORM VIEW ── */
            <form onSubmit={handleProcessPayment} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Order Summary Pill */}
              <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                    Agreement / Retainer
                  </span>
                  <span className="text-xs font-space font-semibold text-[#e3e2e8] block truncate max-w-[280px]">
                    {targetTitle}
                  </span>
                  <span className="text-[10px] text-[#958ea0]">Authorized: {targetClient}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                    Amount Due
                  </span>
                  <span className="text-lg font-space font-bold text-[#ffb4a3]">
                    {targetAmount}
                  </span>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-space text-[#958ea0] block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card', icon: 'credit_card' },
                    { id: 'apple_pay', label: 'Apple Pay', icon: 'phone_iphone' },
                    { id: 'ach', label: 'ACH Transfer', icon: 'account_balance' },
                    { id: 'on_file', label: 'Card on File', icon: 'lock_person' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === m.id
                          ? 'bg-[#ffb4a3]/10 border-[#ffb4a3] text-[#ffdad2]'
                          : 'bg-[#0d0e12] border-[#292a2e] text-[#958ea0] hover:border-[#ffb4a3]/40 hover:text-[#e3e2e8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">{m.icon}</span>
                      <span className="text-[10px] font-space font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Content: Credit Card */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      required
                      className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 •••• •••• 4242"
                        required
                        className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl pl-3 pr-10 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-mono tracking-wider"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#ffb4a3] text-[18px]">
                        credit_card
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        required
                        className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="888"
                        required
                        className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value)}
                        placeholder="94105"
                        required
                        className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCardChecked}
                      onChange={(e) => setSaveCardChecked(e.target.checked)}
                      className="rounded border-[#292a2e] text-[#e85a2b] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-[#cbc3d7] font-sans">
                      Save card to encrypted vault for automatic monthly renewal
                    </span>
                  </label>
                </div>
              )}

              {/* Form Content: Apple Pay */}
              {paymentMethod === 'apple_pay' && (
                <div className="py-4 space-y-3 text-center">
                  <div className="p-4 rounded-xl bg-black border border-[#292a2e] space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-white font-sans text-sm font-semibold">
                      <span className="text-xl"></span>
                      <span>Pay with Touch ID or Face ID</span>
                    </div>
                    <p className="text-[11px] text-[#958ea0] font-sans">
                      Authorize instantaneous payment of {targetAmount} via Apple Pay biometric authentication.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Content: ACH Transfer */}
              {paymentMethod === 'ach' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                      Bank Routing Number (9 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={9}
                      value={achRouting}
                      onChange={(e) => setAchRouting(e.target.value)}
                      placeholder="121000358"
                      required
                      className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                      Account Number
                    </label>
                    <input
                      type="password"
                      value={achAccount}
                      onChange={(e) => setAchAccount(e.target.value)}
                      placeholder="•••• •••• ••••"
                      required
                      className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffb4a3] font-mono"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0d0e12] border border-[#292a2e] flex items-center gap-2 text-[10px] text-[#958ea0]">
                    <span className="material-symbols-outlined text-[15px] text-[#4edea3]">account_balance</span>
                    <span>Direct debit verified via Plaid / Stripe Financial Connections</span>
                  </div>
                </div>
              )}

              {/* Form Content: Card on File */}
              {paymentMethod === 'on_file' && (
                <div className="space-y-3 pt-1">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#141519] to-[#1f2026] border border-[#ffb4a3]/30 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono uppercase text-[#ffdad2] tracking-wider">
                        Cadence Retainer Vault
                      </span>
                      <span className="text-xs font-bold text-[#e3e2e8] font-space">VISA</span>
                    </div>
                    <div className="font-mono text-sm tracking-widest text-[#e3e2e8] mb-2">
                      •••• •••• •••• 7721
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#958ea0]">
                      <span>{targetClient}</span>
                      <span>Expires 12/28</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#958ea0] font-sans">
                    Default card on file registered for monthly coaching membership. 1-click authorization.
                  </p>
                </div>
              )}

              {/* Security Seal */}
              <div className="p-2.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between text-[10px] text-[#958ea0] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-[#4edea3]">lock</span>
                  <span>Stripe PCI-DSS Level 1 Encrypted</span>
                </span>
                <span>Tokenized Vault</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">lock</span>
                      <span>Pay {targetAmount} Securely</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Filtered documents for List View
  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.client.toLowerCase().includes(q) ||
      (d.content && d.content.toLowerCase().includes(q));
    const matchesType = docFilter === 'all' || d.type === docFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pricingItems = blocks.find((b) => b.type === 'pricing')?.items || [];
  const totalPrice = pricingItems.reduce((acc, curr) => acc + curr.total, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER: DOCUMENT GENERATOR STUDIO (DARK THEME & BALANCED SPACING) ──
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === 'editor') {
    return (
      <div className="bg-[#0e0f13] text-[#e3e2e8] rounded-2xl border border-[#292a2e]/70 shadow-2xl overflow-hidden flex flex-col font-sans relative">
        {/* Hidden Word/Docx file input */}
        <input
          type="file"
          ref={wordFileInputRef}
          onChange={handleImportFile}
          accept=".docx,.doc,.txt,.md,.pdf"
          className="hidden"
        />

        {/* Toast */}
        {sendSuccessToast && (
          <div className="fixed top-20 right-8 z-50 bg-[#003824] border border-[#4edea3]/40 text-[#4edea3] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-space text-xs animate-bounce">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{sendSuccessToast}</span>
          </div>
        )}

        {/* ── TOP NAV BAR (DARK THEME) ── */}
        <header className="bg-[#141519] border-b border-[#292a2e]/70 px-5 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Left: Back & Editable Document Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToDocuments}
              className="flex items-center gap-1.5 text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              <span>Back to Documents</span>
            </button>

            <span className="text-[#292a2e]">|</span>

            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#958ea0]">edit</span>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document Title"
                className="font-space font-bold text-sm text-[#e3e2e8] bg-transparent hover:bg-[#1a1b20] focus:bg-[#1a1b20] px-2.5 py-1 rounded-lg border border-transparent focus:border-[#ffb4a3]/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Live Auto-Save Status, Save Now, Load Template, Save Template, Download, Share Link */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            {/* Live 2-Second Auto-Save Status Badge */}
            <div
              onClick={() => executeSave(false, true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[11px] font-space cursor-pointer hover:border-[#ffb4a3]/40 transition-colors"
              title="Auto-saves after 2s of inactivity. Click to save now (Ctrl+S)"
            >
              {saveStatus === 'unsaved' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 font-medium">Unsaved edits (saving...)</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <span className="material-symbols-outlined text-[13px] animate-spin text-[#ffb4a3]">sync</span>
                  <span className="text-[#ffb4a3] font-medium">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <span className="material-symbols-outlined text-[14px] text-[#4edea3]">check_circle</span>
                  <span className="text-[#4edea3] font-medium">
                    {lastSavedTime ? `Saved ${lastSavedTime}` : 'All saved'}
                  </span>
                </>
              )}
            </div>

            <span className="text-[10px] font-space font-bold px-2 py-0.5 rounded-full bg-[#1a1b20] text-[#ffdad2] border border-[#292a2e]">
              {docType.toUpperCase()}
            </span>

            {/* Quick Save Button */}
            <button
              type="button"
              onClick={() => executeSave(false, true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#25262c] text-xs font-space font-semibold cursor-pointer transition-colors"
              title="Save now (Ctrl+S)"
            >
              <span className="material-symbols-outlined text-[15px] text-[#4edea3]">save</span>
              <span className="hidden md:inline">Save</span>
            </button>

            {/* Load Template Button */}
            <button
              type="button"
              onClick={() => setShowLoadTemplatesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#25262c] text-xs font-space font-semibold cursor-pointer transition-colors"
              title="Browse and load document templates"
            >
              <span className="material-symbols-outlined text-[15px] text-[#ffb4a3]">folder_open</span>
              <span>Load template</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#292a2e] text-[#e3e2e8]">
                {templates.length}
              </span>
            </button>

            {/* Save as Template Button */}
            <button
              type="button"
              onClick={handleOpenSaveTemplateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#25262c] text-xs font-space font-semibold cursor-pointer transition-colors"
              title="Save current blocks as reusable template"
            >
              <span className="material-symbols-outlined text-[15px] text-[#ffb4a3]">bookmark_border</span>
              <span>Save as template</span>
            </button>

            {/* Digital Signature Action Button */}
            <button
              type="button"
              onClick={handleOpenSignModalForCurrentDoc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-space font-semibold cursor-pointer transition-colors shadow-sm ${
                activeDocSignature
                  ? 'border-[#4edea3]/40 bg-[#4edea3]/15 text-[#4edea3] hover:bg-[#4edea3]/25'
                  : 'border-[#ffb4a3]/50 bg-[#ffb4a3]/20 text-[#ffdad2] hover:bg-[#ffb4a3]/30'
              }`}
              title="Add or review legal digital signature"
            >
              <span className="material-symbols-outlined text-[15px]">
                {activeDocSignature ? 'verified' : 'draw'}
              </span>
              <span>{activeDocSignature ? 'Signed ✓' : 'Sign'}</span>
            </button>

            {/* Payment & Retainer Vault Checkout Action Button */}
            <button
              type="button"
              onClick={() => handleOpenPaymentModal()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-space font-semibold cursor-pointer transition-colors shadow-sm ${
                activeDocPayment
                  ? 'border-[#4edea3]/40 bg-[#4edea3]/15 text-[#4edea3] hover:bg-[#4edea3]/25'
                  : 'border-[#ffb4a3]/60 bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2]'
              }`}
              title={activeDocPayment ? 'Payment receipt verified' : 'Pay invoice or retainer'}
            >
              <span className="material-symbols-outlined text-[15px]">
                {activeDocPayment ? 'check_circle' : 'credit_card'}
              </span>
              <span>{activeDocPayment ? 'Paid ✓' : 'Pay Invoice'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#25262c] text-xs font-space font-semibold cursor-pointer transition-colors"
              title="Generate PDF or print agreement"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Download</span>
            </button>

            {/* Vivid Orange Share Link Button */}
            <button
              type="button"
              onClick={() => executeSave(true, true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold cursor-pointer transition-all shadow-[0_0_18px_rgba(232,90,43,0.35)]"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <div className="text-left leading-tight">
                <div>Share link</div>
                <div className="text-[9px] font-normal opacity-90 hidden sm:block">(client accepts)</div>
              </div>
            </button>
          </div>
        </header>

        {/* ── NOTICE BANNER (Dark Subtle Amber Alert) ── */}
        <div className="bg-[#221706] border-b border-[#543606] px-5 py-2.5 flex items-center justify-between text-xs text-[#ffdad2]">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[17px] text-[#e85a2b]">link</span>
            {docClient ? (
              <span>
                Linked to <strong className="text-white">{docClient.name}</strong> ({docClient.tierLabel || 'Active Client'}). This document will automatically sync with their portal.
              </span>
            ) : (
              <span className="text-[#ffb4a3]">Not linked to a client or project — it won&apos;t show up on their record.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={docClient?.id || ''}
              onChange={(e) => {
                const found = clients.find((c) => c.id === e.target.value) || null;
                setDocClient(found);
              }}
              className="bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm focus:outline-none"
            >
              <option value="">🔗 Link Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── COMPONENT & FORMATTING TOOLBAR ── */}
        <div className="bg-[#141519] border-b border-[#292a2e]/70 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#cbc3d7]">
          {/* Insert Tools */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => handleAddBlock('heading')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="font-bold text-xs">H₁</span>
              <span>Heading</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('text')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="font-bold text-xs">T</span>
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('pricing')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">table_rows</span>
              <span>Pricing</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('payment')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">credit_card</span>
              <span>Payment</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('table')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">grid_on</span>
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('divider')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="font-bold text-xs">—</span>
              <span>Divider</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('box')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">crop_square</span>
              <span>Box</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlock('image')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer font-space text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">image</span>
              <span>Image</span>
            </button>

            <span className="text-[#292a2e]">|</span>

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1 rounded transition-colors ${
                historyIndex <= 0 ? 'text-[#3a3942] cursor-not-allowed' : 'text-[#958ea0] hover:text-white cursor-pointer'
              }`}
              title="Undo"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1 rounded transition-colors ${
                historyIndex >= history.length - 1 ? 'text-[#3a3942] cursor-not-allowed' : 'text-[#958ea0] hover:text-white cursor-pointer'
              }`}
              title="Redo"
            >
              <span className="material-symbols-outlined text-[16px]">redo</span>
            </button>

            <span className="text-[#292a2e]">|</span>

            {/* Page Count */}
            <span className="text-[11px] text-[#958ea0] font-mono">Page 1/1</span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 text-[11px] text-[#cbc3d7] bg-[#0d0e12] px-2 py-0.5 rounded-lg border border-[#292a2e]">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="hover:text-white cursor-pointer font-bold px-1"
              >
                -
              </button>
              <span className="font-mono">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="hover:text-white cursor-pointer font-bold px-1"
              >
                +
              </button>
            </div>
          </div>

          {/* Right Tools: Import Word file & Purple AI Builder */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => wordFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#292a2e] bg-[#1a1b20] text-[#cbc3d7] hover:text-white font-space text-xs font-medium cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">upload</span>
              <span>Import Word file</span>
            </button>

            {/* Purple AI Builder Button */}
            <button
              type="button"
              onClick={handleAIBuilder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold font-space text-xs cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.4)] transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              <span>AI Builder</span>
            </button>
          </div>
        </div>

        {/* ── MAIN WORKSPACE: CANVAS (CENTER) + DESIGN SIDEBAR (RIGHT) ── */}
        <div className="flex-1 flex overflow-hidden min-h-[820px]">
          {/* Canvas Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center bg-[#0a0b0e]">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                fontFamily: selectedFont === 'Space Grotesk' ? 'Space Grotesk, sans-serif' : selectedFont,
              }}
              className="w-full max-w-3xl min-h-[960px] bg-[#141519] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.7)] p-8 sm:p-12 transition-transform duration-150 flex flex-col justify-between border border-[#292a2e] relative"
            >
              {/* Page Indicator & Top Right Duplicate/Trash icons */}
              <div className="absolute top-4 left-5 text-[10px] text-[#4a4855] font-mono">Page 1/1</div>
              <div className="absolute top-4 right-5 flex items-center gap-1.5 text-[#4a4855]">
                <button
                  type="button"
                  onClick={() => {
                    const clonedBlocks = [...blocks];
                    setBlocks(clonedBlocks);
                    setSendSuccessToast('Page content duplicated.');
                    setTimeout(() => setSendSuccessToast(null), 2500);
                  }}
                  className="hover:text-[#cbc3d7] cursor-pointer p-0.5 transition-colors"
                  title="Duplicate Page"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Primary page cannot be deleted')}
                  className="hover:text-[#ff5449] cursor-pointer p-0.5 transition-colors"
                  title="Delete Page"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                </button>
              </div>

              {/* Document Header Letterhead */}
              <div>
                <div className="flex items-start justify-between pb-6 border-b-2" style={{ borderColor: accentColor }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-space font-black text-2xl tracking-wider" style={{ color: accentColor }}>
                        CADENCE
                      </span>
                      <span className="text-[10px] font-space font-bold uppercase px-2 py-0.5 rounded bg-[#1a1b20] text-[#ffdad2] border border-[#292a2e]">
                        Performance
                      </span>
                    </div>
                    <p className="text-xs text-[#958ea0] mt-1 font-sans">High-Performance Nutrition &amp; Athletic Periodization</p>
                    <p className="text-xs text-[#958ea0] font-sans">Director: Coach Julian Vance</p>
                  </div>

                  <div className="text-right text-xs text-[#958ea0] space-y-0.5 font-space">
                    <p className="font-bold text-[#e3e2e8]">
                      Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </p>
                    <p className="text-[#958ea0]">Ref: CAD-2026-Q4</p>
                    <p className="text-[#cbc3d7] font-semibold">Recipient: {docClient?.name || 'Client'}</p>
                  </div>
                </div>

                {/* ── Dynamic Content Blocks ── */}
                <div className="space-y-6 pt-6">
                  {blocks.map((block, bIdx) => {
                    return (
                      <div
                        key={block.id}
                        className="group relative p-2.5 -m-2 rounded-xl hover:ring-1 hover:ring-[#ffb4a3]/40 transition-all"
                      >
                        {/* Hover Block Controls: Move Up, Move Down, Delete */}
                        <div className="absolute -right-2 -top-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {bIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(bIdx, 'up')}
                              className="w-5 h-5 rounded-full bg-[#292a2e] hover:bg-[#1a1b20] text-[#cbc3d7] hover:text-white flex items-center justify-center cursor-pointer shadow-sm"
                              title="Move block up"
                            >
                              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
                            </button>
                          )}
                          {bIdx < blocks.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(bIdx, 'down')}
                              className="w-5 h-5 rounded-full bg-[#292a2e] hover:bg-[#1a1b20] text-[#cbc3d7] hover:text-white flex items-center justify-center cursor-pointer shadow-sm"
                              title="Move block down"
                            >
                              <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="w-5 h-5 rounded-full bg-[#292a2e] hover:bg-[#ff5449] text-[#958ea0] hover:text-white flex items-center justify-center cursor-pointer shadow-sm"
                            title="Delete block"
                          >
                            <span className="material-symbols-outlined text-[12px]">close</span>
                          </button>
                        </div>

                        {/* HEADING BLOCK */}
                        {block.type === 'heading' && (
                          <input
                            type="text"
                            value={block.content || ''}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full font-space font-bold text-lg sm:text-xl text-[#e3e2e8] bg-transparent focus:bg-[#0d0e12] p-1.5 rounded-lg border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none"
                            placeholder="Type heading..."
                          />
                        )}

                        {/* TEXT BLOCK */}
                        {block.type === 'text' && (
                          <textarea
                            rows={3}
                            value={block.content || ''}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full text-xs text-[#cbc3d7] leading-relaxed bg-transparent focus:bg-[#0d0e12] p-2 rounded-lg border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none resize-none font-sans"
                            placeholder="Write text here..."
                          />
                        )}

                        {/* BOX / CALLOUT BLOCK (INLINE EDITABLE) */}
                        {block.type === 'box' && (
                          <div
                            className="p-3.5 rounded-xl text-xs leading-relaxed border-l-4 font-sans"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              borderColor: accentColor,
                              color: '#ffdad2',
                            }}
                          >
                            <textarea
                              rows={2}
                              value={block.content || ''}
                              onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                              placeholder="Type callout or protocol instruction..."
                              className="w-full bg-transparent p-1 rounded border border-transparent focus:border-[#ffb4a3]/40 focus:bg-[#0d0e12]/50 text-xs font-sans text-[#ffdad2] focus:outline-none resize-none"
                            />
                          </div>
                        )}

                        {/* PRICING TABLE BLOCK (INLINE EDITABLE WITH ADD/REMOVE ITEMS) */}
                        {block.type === 'pricing' && (
                          <div className="space-y-2.5">
                            <div className="border border-[#292a2e] rounded-xl overflow-hidden bg-[#0d0e12]">
                              <table className="w-full text-left text-xs font-sans">
                                <thead className="bg-[#1a1b20] text-[#958ea0] font-space uppercase text-[10px] tracking-wider border-b border-[#292a2e]">
                                  <tr>
                                    <th className="p-3">Description</th>
                                    <th className="p-3 text-center w-16">Qty</th>
                                    <th className="p-3 text-right w-28">Rate ($)</th>
                                    <th className="p-3 text-right w-24">Total</th>
                                    <th className="p-3 text-center w-10"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#292a2e]/50">
                                  {(block.items || []).map((item, itIdx) => (
                                    <tr key={itIdx} className="hover:bg-[#1a1b20]/40 transition-colors group/row">
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={item.desc}
                                          onChange={(e) =>
                                            handleUpdatePricingItem(block.id, itIdx, 'desc', e.target.value)
                                          }
                                          className="w-full bg-transparent focus:bg-[#141519] px-2 py-1 rounded text-[#e3e2e8] font-medium border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none"
                                          placeholder="Item description"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          min="1"
                                          value={item.qty}
                                          onChange={(e) =>
                                            handleUpdatePricingItem(
                                              block.id,
                                              itIdx,
                                              'qty',
                                              parseInt(e.target.value, 10) || 1
                                            )
                                          }
                                          className="w-12 text-center bg-transparent focus:bg-[#141519] px-1 py-1 rounded text-[#958ea0] font-mono border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none"
                                        />
                                      </td>
                                      <td className="p-2 text-right">
                                        <input
                                          type="number"
                                          min="0"
                                          value={item.rate}
                                          onChange={(e) =>
                                            handleUpdatePricingItem(
                                              block.id,
                                              itIdx,
                                              'rate',
                                              parseInt(e.target.value, 10) || 0
                                            )
                                          }
                                          className="w-24 text-right bg-transparent focus:bg-[#141519] px-2 py-1 rounded text-[#958ea0] font-mono border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none"
                                        />
                                      </td>
                                      <td className="p-3 text-right text-[#e3e2e8] font-bold font-mono">
                                        ${item.total.toLocaleString()}
                                      </td>
                                      <td className="p-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePricingItem(block.id, itIdx)}
                                          className="text-[#958ea0] hover:text-[#ff5449] opacity-0 group-hover/row:opacity-100 transition-opacity p-1 cursor-pointer"
                                          title="Delete line item"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">delete</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="p-2 bg-[#141519] border-t border-[#292a2e]/60 flex justify-between items-center text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleAddPricingItem(block.id)}
                                  className="text-[11px] font-space font-semibold px-2.5 py-1 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[13px]">add</span>
                                  <span>Add Line Item</span>
                                </button>
                                <span className="text-[11px] text-[#958ea0] font-mono">
                                  {block.items?.length || 0} line items
                                </span>
                              </div>
                            </div>

                            {/* Total summary */}
                            <div className="flex justify-end pt-1">
                              <div className="w-64 p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] text-xs flex items-center justify-between font-space">
                                <span className="text-[#958ea0]">Monthly Retainer:</span>
                                <span className="font-bold text-sm" style={{ color: accentColor }}>
                                  ${totalPrice.toLocaleString()} USD
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TABLE BLOCK (Biomarker / Schedule Table) */}
                        {block.type === 'table' && (
                          <div className="border border-[#292a2e] rounded-xl overflow-hidden bg-[#0d0e12] p-3 space-y-2.5">
                            <div className="flex items-center justify-between pb-1 border-b border-[#292a2e]">
                              <span className="font-space font-bold text-xs text-[#e3e2e8] flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px]" style={{ color: accentColor }}>grid_on</span>
                                {block.content || 'Biomarker Target Schedule'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddTableRow(block.id)}
                                className="text-[10px] font-space font-semibold px-2 py-0.5 rounded bg-[#1a1b20] hover:bg-[#25262c] border border-[#292a2e] text-[#cbc3d7] hover:text-white cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[13px]">add</span>
                                <span>Add Row</span>
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-sans">
                                <thead className="bg-[#1a1b20] text-[#958ea0] font-space uppercase text-[10px] tracking-wider border-b border-[#292a2e]">
                                  <tr>
                                    {(block.tableData?.headers || ['Metric', 'Baseline', 'Target', 'Timing']).map((h, hIdx) => (
                                      <th key={hIdx} className="p-2">
                                        <input
                                          type="text"
                                          value={h}
                                          onChange={(e) => handleUpdateTableHeader(block.id, hIdx, e.target.value)}
                                          className="w-full bg-transparent focus:bg-[#141519] p-1 rounded font-space font-bold uppercase text-[10px] text-[#958ea0] focus:text-white border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none"
                                        />
                                      </th>
                                    ))}
                                    <th className="p-2 w-8"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#292a2e]/50">
                                  {(block.tableData?.rows || []).map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-[#1a1b20]/30 transition-colors group/trow">
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-1.5">
                                          <input
                                            type="text"
                                            value={cell}
                                            onChange={(e) => handleUpdateTableCell(block.id, rIdx, cIdx, e.target.value)}
                                            className="w-full bg-transparent focus:bg-[#141519] p-1 rounded border border-transparent focus:border-[#ffb4a3]/40 text-[#e3e2e8] text-xs font-mono focus:outline-none"
                                          />
                                        </td>
                                      ))}
                                      <td className="p-1.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTableRow(block.id, rIdx)}
                                          className="text-[#958ea0] hover:text-[#ff5449] opacity-0 group-hover/trow:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                          title="Delete row"
                                        >
                                          <span className="material-symbols-outlined text-[13px]">delete</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* IMAGE BLOCK */}
                        {block.type === 'image' && (
                          <div className="border border-[#292a2e] rounded-xl overflow-hidden bg-[#0d0e12] p-3 space-y-2.5">
                            <div className="h-44 sm:h-52 w-full rounded-lg overflow-hidden bg-[#1a1b20] relative">
                              <img
                                src={block.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'}
                                alt="Biometric telemetry chart"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <input
                                type="text"
                                value={block.imageCaption || ''}
                                onChange={(e) => handleUpdateBlockCaption(block.id, e.target.value)}
                                placeholder="Figure caption..."
                                className="w-full text-[11px] text-[#958ea0] bg-transparent focus:bg-[#1a1b20] p-1.5 rounded-lg border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none italic"
                              />
                              <input
                                type="text"
                                value={block.imageUrl || ''}
                                onChange={(e) => handleUpdateBlockImageUrl(block.id, e.target.value)}
                                placeholder="Paste Image URL..."
                                className="w-full text-[10px] text-[#958ea0] font-mono bg-transparent focus:bg-[#1a1b20] p-1.5 rounded-lg border border-transparent focus:border-[#ffb4a3]/40 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* PAYMENT BLOCK (INLINE EDITABLE + CHECKOUT TRIGGER) */}
                        {block.type === 'payment' && (
                          <div className="p-4 rounded-xl border border-[#292a2e] bg-[#0d0e12] text-xs text-[#cbc3d7] space-y-3">
                            <div className="flex items-start gap-3">
                              <span className="material-symbols-outlined text-[20px]" style={{ color: accentColor }}>
                                verified_user
                              </span>
                              <div className="flex-1">
                                <span className="font-space font-bold block text-[#e3e2e8] mb-1">
                                  Billing &amp; Payment Schedule
                                </span>
                                <textarea
                                  rows={2}
                                  value={block.content || ''}
                                  onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                  placeholder="Specify Stripe billing terms, auto-debit dates, or retainer clauses..."
                                  className="w-full bg-transparent focus:bg-[#141519] p-1.5 rounded border border-transparent focus:border-[#ffb4a3]/40 text-xs text-[#cbc3d7] font-sans focus:outline-none resize-none"
                                />
                              </div>
                            </div>

                            {/* Live Payment Status Banner & Checkout Action */}
                            <div className="pt-2 border-t border-[#292a2e]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              {activeDocPayment ? (
                                <div className="flex items-center gap-2 text-[#4edea3] font-mono text-[11px]">
                                  <span className="material-symbols-outlined text-[16px]">verified</span>
                                  <span>
                                    Paid {activeDocPayment.amount} via Stripe · {activeDocPayment.paidAt}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[#958ea0] text-[11px]">
                                  <span className="material-symbols-outlined text-[15px] text-[#ffb4a3]">lock</span>
                                  <span>Secure online payment via Stripe Vault</span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal()}
                                className={`px-3 py-1.5 rounded-lg text-xs font-space font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                                  activeDocPayment
                                    ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 hover:bg-[#4edea3]/25'
                                    : 'bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {activeDocPayment ? 'receipt_long' : 'credit_card'}
                                </span>
                                <span>
                                  {activeDocPayment
                                    ? 'View Receipt'
                                    : `Pay ${totalPrice > 0 ? `$${totalPrice.toLocaleString()}` : '$1,500'} Now`}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* DIVIDER BLOCK */}
                        {block.type === 'divider' && <hr className="border-t border-[#292a2e] my-3" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Signature Footer */}
              <div className="pt-8 border-t border-[#292a2e] mt-12 grid grid-cols-2 gap-8 text-xs text-[#958ea0] font-space">
                <div>
                  <p className="font-bold text-[#e3e2e8] mb-3">Cadence Performance Coaching</p>
                  <div className="border border-[#292a2e] bg-[#0d0e12] rounded-xl p-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#292a2e]/60 mb-2">
                      <span className="italic font-serif text-[#ffdad2] text-base">Julian Vance</span>
                      <span className="text-[10px] font-space text-[#4edea3] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>Authorized</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-[#958ea0] font-sans">Lead Coach &amp; Performance Director</p>
                    <p className="text-[9px] text-[#4a4855] font-mono mt-0.5">Cadence Vault Signature Hash #CAD-COACH-JV</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[#e3e2e8]">Client Acknowledgment &amp; Signature</p>
                    {activeDocSignature && (
                      <span className="text-[10px] font-space text-[#4edea3] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">verified_user</span>
                        <span>Legally Binding</span>
                      </span>
                    )}
                  </div>

                  {activeDocSignature ? (
                    <div className="border border-[#4edea3]/30 bg-[#4edea3]/5 rounded-xl p-3 space-y-2 relative group/sig">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-space font-bold text-[#4edea3] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          <span>Signed by {activeDocSignature.signedBy}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleOpenSignModalForCurrentDoc}
                          className="opacity-0 group-hover/sig:opacity-100 text-[10px] font-space text-[#958ea0] hover:text-[#ffdad2] transition-opacity cursor-pointer flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-[11px]">edit</span>
                          <span>Re-sign</span>
                        </button>
                      </div>

                      {/* Render Drawn, Typed, or Uploaded Signature */}
                      <div className="py-1">
                        {activeDocSignature.signatureType === 'draw' || activeDocSignature.signatureType === 'upload' ? (
                          <img
                            src={activeDocSignature.signatureData}
                            alt="Signature"
                            className="max-h-12 object-contain filter invert opacity-95"
                          />
                        ) : (
                          <div className="font-serif italic text-xl text-[#ffdad2] tracking-wider py-1">
                            {activeDocSignature.signatureData}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-[#958ea0] font-mono border-t border-[#292a2e]/60 pt-1.5">
                        <span>{activeDocSignature.signedAt}</span>
                        <span className="truncate max-w-[150px]">{activeDocSignature.certificateHash || 'CAD-SIGN-VERIFIED'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#292a2e] hover:border-[#ffb4a3]/60 bg-[#0d0e12]/60 rounded-xl p-4 text-center transition-colors">
                      <p className="text-[11px] text-[#958ea0] mb-2.5 font-sans">
                        {docClient ? `Awaiting authorization from ${docClient.name}` : 'Awaiting digital sign-off'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenSignModalForCurrentDoc}
                        className="px-3.5 py-1.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">draw</span>
                        <span>Sign Document Now</span>
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-[#4a4855] mt-1.5 font-sans">Encrypted &amp; timestamped via Cadence Vault</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT DESIGN & SETTINGS SIDEBAR (DARK THEME) ── */}
          <aside className="w-80 bg-[#141519] border-l border-[#292a2e]/70 flex flex-col justify-between shadow-2xl z-20">
            <div>
              {/* Sidebar Tabs: Design | Link to | Templates */}
              <div className="flex border-b border-[#292a2e]/70 text-xs font-space font-bold text-[#958ea0]">
                <button
                  type="button"
                  onClick={() => setSidebarTab('design')}
                  className={`flex-1 py-3 text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    sidebarTab === 'design'
                      ? 'border-b-2 border-[#e85a2b] text-[#e85a2b] bg-[#1a1b20]/40'
                      : 'hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Design</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab('link')}
                  className={`flex-1 py-3 text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    sidebarTab === 'link'
                      ? 'border-b-2 border-[#e85a2b] text-[#e85a2b] bg-[#1a1b20]/40'
                      : 'hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  <span>Link to</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab('templates')}
                  className={`flex-1 py-3 text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    sidebarTab === 'templates'
                      ? 'border-b-2 border-[#e85a2b] text-[#e85a2b] bg-[#1a1b20]/40'
                      : 'hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">folder_open</span>
                  <span>Templates</span>
                </button>
              </div>

              {/* Tab 1: Design Controls */}
              {sidebarTab === 'design' && (
                <div className="p-6 space-y-6 text-xs text-[#cbc3d7]">
                  <div className="space-y-3.5">
                    <span className="font-space font-bold uppercase tracking-wider text-[10px] text-[#958ea0] block">
                      Document Style
                    </span>

                    {/* Accent Color Selection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="font-space font-bold text-xs text-[#e3e2e8]">ACCENT</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {['#e85a2b', '#3b82f6', '#10b981', '#8b5cf6', '#ffb4a3'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setAccentColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                              accentColor === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font Family Selector */}
                    <div>
                      <select
                        value={selectedFont}
                        onChange={(e) => setSelectedFont(e.target.value)}
                        className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-space focus:outline-none focus:border-[#ffb4a3] cursor-pointer"
                      >
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Inter">Inter</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto-save Status Info */}
                  <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 space-y-2 text-[11px] text-[#958ea0] leading-relaxed font-sans">
                    <div className="flex items-center gap-1.5 text-[#e3e2e8] font-space font-bold">
                      <span className="material-symbols-outlined text-[15px] text-[#4edea3]">cloud_done</span>
                      <span>Continuous Cloud Sync</span>
                    </div>
                    <p>All edits to headings, text, pricing rates, and tables auto-save every 2 seconds to local session vault.</p>
                    <p>Press <kbd className="px-1 py-0.5 rounded bg-[#1a1b20] text-[#ffdad2] text-[10px] font-mono">Ctrl+S</kbd> to save immediately at any time.</p>
                  </div>
                </div>
              )}

              {/* Tab 2: Link to Client / Retainer */}
              {sidebarTab === 'link' && (
                <div className="p-6 space-y-4 text-xs text-[#cbc3d7] font-sans">
                  <div>
                    <label className="font-space font-bold text-xs text-[#ffdad2] block mb-1.5">
                      Assigned Client
                    </label>
                    <select
                      value={docClient?.id || ''}
                      onChange={(e) => {
                        const c = clients.find((client) => client.id === e.target.value) || null;
                        setDocClient(c);
                      }}
                      className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl p-2.5 text-xs text-[#e3e2e8] font-space focus:outline-none focus:border-[#ffb4a3] cursor-pointer"
                    >
                      <option value="">No Client Linked</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.tierLabel || 'Active Client'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {docClient && (
                    <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-2 text-xs">
                      <div className="text-[#958ea0]">Stripe Customer Profile:</div>
                      <div className="font-mono font-bold text-[#e3e2e8]">cus_Cadence_{docClient.initials}</div>
                      <div className="text-[#cbc3d7]">Monthly Retainer: <strong className="text-[#4edea3]">{docClient.monthlyRetainer}</strong></div>
                      <div className="text-[#cbc3d7]">Tier: <strong className="text-white">{docClient.tierLabel}</strong></div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Quick Templates in Sidebar */}
              {sidebarTab === 'templates' && (
                <div className="p-4 space-y-3.5 text-xs font-sans overflow-y-auto max-h-[720px]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]">
                    <span className="font-space font-bold text-xs text-[#e3e2e8]">Quick Templates</span>
                    <button
                      type="button"
                      onClick={() => setShowLoadTemplatesModal(true)}
                      className="text-[11px] font-space text-[#ffb4a3] hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Browse All</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] hover:border-[#ffb4a3]/50 transition-all space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="font-space font-bold text-xs text-[#e3e2e8] leading-tight">
                            {tmpl.name}
                          </h5>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1a1b20] text-[#ffdad2] border border-[#292a2e] shrink-0">
                            {tmpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#958ea0] line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-mono text-[#4edea3]">{tmpl.defaultAmount || 'Retainer'}</span>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate(tmpl)}
                            className="px-2.5 py-1 rounded-lg bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-[10px] font-space font-bold cursor-pointer transition-all"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Right Floating Help Pill */}
            <div className="p-4 border-t border-[#292a2e]/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="h-8 px-3.5 rounded-full bg-[#e85a2b] hover:bg-[#ff6b3d] text-white font-space font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">help</span>
                <span>Help</span>
              </button>
            </div>
          </aside>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── MODAL 1: SAVE AS TEMPLATE ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
            <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#e85a2b]/20 border border-[#e85a2b]/40 flex items-center justify-center text-[#e85a2b]">
                    <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                  </div>
                  <div>
                    <h3 className="font-space font-bold text-sm text-[#e3e2e8]">Save as Template</h3>
                    <p className="text-[11px] text-[#958ea0]">Save current canvas blocks as a reusable template</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="text-[#958ea0] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={saveTmplName}
                    onChange={(e) => setSaveTmplName(e.target.value)}
                    placeholder="e.g. 12-Week Metabolic Peaking Template"
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                      Category
                    </label>
                    <select
                      value={saveTmplCategory}
                      onChange={(e) => setSaveTmplCategory(e.target.value)}
                      className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                    >
                      <option value="Retainers">Retainers</option>
                      <option value="Protocols">Protocols</option>
                      <option value="Contest Prep">Contest Prep</option>
                      <option value="Executive">Executive</option>
                      <option value="Onboarding / Legal">Onboarding / Legal</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                      Document Type
                    </label>
                    <select
                      value={saveTmplType}
                      onChange={(e) => setSaveTmplType(e.target.value as DocumentType)}
                      className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer capitalize"
                    >
                      <option value="contract">Contract</option>
                      <option value="proposal">Proposal</option>
                      <option value="protocol">Protocol</option>
                      <option value="invoice">Invoice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={saveTmplDesc}
                    onChange={(e) => setSaveTmplDesc(e.target.value)}
                    placeholder="Brief summary of when to use this template..."
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-sans resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-space">
                    <span className="text-[#958ea0]">Blocks to be saved:</span>
                    <span className="text-[#ffdad2] font-bold">{blocks.length} blocks</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {blocks.map((b, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-space uppercase px-2 py-0.5 rounded bg-[#1a1b20] border border-[#292a2e] text-[#cbc3d7]"
                      >
                        {b.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#292a2e] flex items-center justify-end gap-2 bg-[#0e0f13]">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveTemplate}
                  className="px-4 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── MODAL 2: LOAD TEMPLATES (HOW TO LOAD) ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showLoadTemplatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
            <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ffb4a3]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffb4a3]">
                    <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  </div>
                  <div>
                    <h3 className="font-space font-bold text-sm text-[#e3e2e8]">Load Document Template</h3>
                    <p className="text-[11px] text-[#958ea0]">
                      Select any preset or saved template to load directly into the editor
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoadTemplatesModal(false)}
                  className="text-[#958ea0] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Filter Tabs & Search */}
              <div className="px-6 py-3 border-b border-[#292a2e] bg-[#0d0e12] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'Retainers', 'Protocols', 'Contest Prep', 'Executive', 'Onboarding / Legal', 'custom'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTemplateFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-space font-semibold transition-all cursor-pointer ${
                        templateFilter === cat
                          ? 'bg-[#ffb4a3] text-[#3a0900] shadow-sm'
                          : 'bg-[#1a1b20] border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8]'
                      }`}
                    >
                      {cat === 'all' ? 'All Templates' : cat === 'custom' ? 'My Saved' : cat}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-[15px] text-[#958ea0]">search</span>
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full bg-[#141519] border border-[#292a2e] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none focus:border-[#ffb4a3] font-sans"
                  />
                </div>
              </div>

              {/* Templates Grid List */}
              <div className="p-6 overflow-y-auto flex-1 space-y-3">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-[#958ea0] space-y-2">
                    <span className="material-symbols-outlined text-[36px] opacity-40">find_in_page</span>
                    <p className="text-xs">No templates found matching your search.</p>
                  </div>
                ) : (
                  filteredTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] hover:border-[#ffb4a3]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-space font-bold text-sm text-[#e3e2e8] group-hover:text-white transition-colors">
                            {tmpl.name}
                          </h4>
                          <span className="text-[9px] font-space font-bold uppercase px-2 py-0.5 rounded bg-[#1a1b20] text-[#ffdad2] border border-[#292a2e]">
                            {tmpl.category}
                          </span>
                          <span className="text-[9px] font-space uppercase px-2 py-0.5 rounded bg-[#292a2e]/60 text-[#958ea0]">
                            {tmpl.type}
                          </span>
                          {tmpl.isPreset ? (
                            <span className="text-[9px] font-mono text-[#4edea3]">Preset</span>
                          ) : (
                            <span className="text-[9px] font-mono text-[#ffb4a3]">Custom Saved</span>
                          )}
                        </div>

                        <p className="text-xs text-[#958ea0] font-sans leading-relaxed">
                          {tmpl.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-[#cbc3d7] font-space pt-1">
                          <span>
                            Blocks: <strong className="text-white">{tmpl.blocks.length}</strong>
                          </span>
                          {tmpl.defaultAmount && (
                            <span>
                              Est. Rate: <strong className="text-[#4edea3]">{tmpl.defaultAmount}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {!tmpl.isPreset && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomTemplate(tmpl.id)}
                            className="w-8 h-8 rounded-xl bg-[#1a1b20] border border-[#292a2e] text-[#958ea0] hover:text-[#ff5449] hover:border-[#ff5449]/40 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete custom template"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-4 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">file_open</span>
                          <span>Load Template</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-3 border-t border-[#292a2e] flex items-center justify-between text-xs text-[#958ea0] bg-[#0e0f13]">
                <span>{filteredTemplates.length} templates available in vault</span>
                <button
                  type="button"
                  onClick={() => setShowLoadTemplatesModal(false)}
                  className="px-4 py-1.5 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#cbc3d7] hover:text-white hover:bg-[#1a1b20] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 3: DIGITAL SIGNATURE & VERIFICATION SUITE ── */}
        {renderSignatureModal()}

        {/* ── MODAL 4: STRIPE VAULT PAYMENT & CHECKOUT SUITE ── */}
        {renderPaymentModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER: DOCUMENTS VAULT LIST VIEW (STANDARD TABLE & METRIC CARDS) ──
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 pb-12 font-sans">
      {/* Toast Notification */}
      {sendSuccessToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#003824] border border-[#4edea3]/40 text-[#4edea3] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-space text-xs animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{sendSuccessToast}</span>
        </div>
      )}

      {/* ── TOP HERO BANNER & GENERATOR LAUNCHER ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141519] border border-[#292a2e]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 font-space text-xs text-[#ffdad2] font-bold uppercase tracking-wider">
            <span>Core</span>
            <span className="text-[#958ea0]">//</span>
            <span>Documents Vault</span>
          </div>
          <h2 className="font-space text-2xl text-[#e3e2e8] font-bold mt-1">
            Contracts, Proposals &amp; Clinical Protocols
          </h2>
          <p className="text-xs text-[#958ea0] font-sans mt-0.5 max-w-xl">
            Generate legally binding retainer agreements, performance proposals, and invoices with one click. Dispatch directly to client portals &amp; chat.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenNewDocument}
            className="h-10 px-4 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white font-space font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(232,90,43,0.35)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] font-bold">edit_document</span>
            <span>Open Document Studio</span>
          </button>
        </div>
      </div>

      {/* ── QUICK STATS METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
          <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">Total In Vault</span>
          <span className="text-xl font-space font-bold text-[#e3e2e8] mt-0.5 block">{documents.length}</span>
          <span className="text-[10px] text-[#4edea3] font-sans mt-0.5 block">Session-synced</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
          <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">Active Contracts</span>
          <span className="text-xl font-space font-bold text-[#4edea3] mt-0.5 block">
            {documents.filter((d) => d.type === 'contract' && d.status === 'signed').length}
          </span>
          <span className="text-[10px] text-[#958ea0] font-sans mt-0.5 block">Signed &amp; executed</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
          <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">Templates Available</span>
          <span className="text-xl font-space font-bold text-[#ffb4a3] mt-0.5 block">
            {templates.length}
          </span>
          <span className="text-[10px] text-[#ffb4a3] font-sans mt-0.5 block">Reusable blueprints</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
          <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">Dispatched to Clients</span>
          <span className="text-xl font-space font-bold text-[#60a5fa] mt-0.5 block">
            {documents.filter((d) => d.status === 'sent').length}
          </span>
          <span className="text-[10px] text-[#60a5fa] font-sans mt-0.5 block">Delivered in portal</span>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH CONTROLS ── */}
      <div className="bg-[#141519] border border-[#292a2e]/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'contract', 'proposal', 'invoice', 'protocol'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDocFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-space font-semibold transition-all cursor-pointer capitalize ${
                docFilter === t
                  ? 'bg-[#ffb4a3] text-[#3a0900] shadow-sm'
                  : 'bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              {t === 'all' ? 'All Types' : t + 's'}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0d0e12] border border-[#292a2e] text-[#e3e2e8] text-xs font-space rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#ffb4a3] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="signed">Signed</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="draft">Draft</option>
          </select>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-[#958ea0]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents or clients..."
              className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none focus:border-[#ffb4a3] font-sans"
            />
          </div>
        </div>
      </div>

      {/* ── DOCUMENTS TABLE ── */}
      <div className="rounded-2xl bg-[#141519] border border-[#292a2e]/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1a1b20] border-b border-[#292a2e]/60 text-[#958ea0] font-space uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Retainer Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]/50 text-[#cbc3d7]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#958ea0]">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <span className="material-symbols-outlined text-[28px] opacity-40">description</span>
                      <p className="text-xs">No documents match the current filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => handleOpenExistingDoc(doc)}
                      className="hover:bg-[#1a1b20]/50 transition-colors cursor-pointer group"
                    >
                      {/* Document Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#292a2e]/60 flex items-center justify-center text-[#ffdad2] shrink-0 group-hover:bg-[#ffb4a3]/20 group-hover:text-[#ffb4a3] transition-colors">
                            <span className="material-symbols-outlined text-[15px]">
                              {doc.type === 'contract'
                                ? 'assignment'
                                : doc.type === 'invoice'
                                ? 'receipt_long'
                                : doc.type === 'protocol'
                                ? 'health_and_safety'
                                : 'description'}
                            </span>
                          </div>
                          <div>
                            <span className="font-space font-semibold text-[#e3e2e8] group-hover:text-white transition-colors block text-xs">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-[#958ea0] block">
                              PDF · {doc.size || '112 KB'} {doc.updatedAt ? `· Saved ${doc.updatedAt}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 font-space text-[#e3e2e8]">
                        {doc.client}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-space font-semibold uppercase px-2 py-0.5 rounded bg-[#1a1b20] text-[#ffdad2] border border-[#292a2e]">
                          {doc.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#4edea3]">
                        {doc.amount || '$1,800/mo'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#958ea0] font-mono text-[11px]">
                        {doc.date}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-space font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                            doc.status === 'paid'
                              ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30'
                              : doc.status === 'signed'
                              ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                              : doc.status === 'pending'
                              ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                              : doc.status === 'sent'
                              ? 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30'
                              : 'bg-[#292a2e] text-[#958ea0] border border-[#343439]'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>

                      {/* Direct Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sign Document Action Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSignModalForDoc(doc)}
                            className={`px-2.5 py-1 rounded-lg font-space text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              doc.signature || doc.status === 'signed'
                                ? 'bg-[#4edea3]/15 hover:bg-[#4edea3]/25 text-[#4edea3] border border-[#4edea3]/30'
                                : 'bg-[#ffb4a3]/20 hover:bg-[#ffb4a3]/30 text-[#ffdad2] border border-[#ffb4a3]/40'
                            }`}
                            title={doc.signature || doc.status === 'signed' ? 'Review legal digital signature certificate' : 'Digitally sign and execute document'}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {doc.signature || doc.status === 'signed' ? 'verified' : 'draw'}
                            </span>
                            <span className="hidden sm:inline">
                              {doc.signature || doc.status === 'signed' ? 'Signed' : 'Sign'}
                            </span>
                          </button>

                          {/* Payment / Checkout Action Button */}
                          {doc.amount && doc.amount !== '$0' && (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(doc)}
                              className={`px-2.5 py-1 rounded-lg font-space text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                doc.payment || doc.status === 'paid'
                                  ? 'bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#34d399] border border-[#10b981]/30'
                                  : 'bg-[#ffb4a3] hover:bg-[#ffdad2] text-[#3a0900] border border-[#ffb4a3]'
                              }`}
                              title={doc.payment || doc.status === 'paid' ? 'View payment confirmation & receipt' : `Pay invoice (${doc.amount}) via Stripe Vault`}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {doc.payment || doc.status === 'paid' ? 'check_circle' : 'credit_card'}
                              </span>
                              <span className="hidden sm:inline">
                                {doc.payment || doc.status === 'paid' ? 'Paid' : 'Pay'}
                              </span>
                            </button>
                          )}

                          {/* Send to Client Button */}
                          <button
                            type="button"
                            onClick={() => handleSendDocToClient(doc)}
                            className="px-2.5 py-1 rounded-lg bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#60a5fa] font-space text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Send directly to client portal & chat"
                          >
                            <span className="material-symbols-outlined text-[13px]">send</span>
                            <span className="hidden sm:inline">Send to Client</span>
                          </button>

                          {/* Duplicate / Clone Button */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateDoc(doc)}
                            className="w-7 h-7 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#ffdad2] flex items-center justify-center transition-colors cursor-pointer"
                            title="Duplicate document"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          </button>

                          {/* Edit / Open Studio Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenExistingDoc(doc)}
                            className="w-7 h-7 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#ffb4a3] flex items-center justify-center transition-colors cursor-pointer"
                            title="Open Document Studio"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit_document</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="w-7 h-7 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#ff5449] flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DIGITAL SIGNATURE & VERIFICATION SUITE MODAL ── */}
      {renderSignatureModal()}

      {/* ── STRIPE VAULT PAYMENT & CHECKOUT SUITE MODAL ── */}
      {renderPaymentModal()}
    </div>
  );
}
