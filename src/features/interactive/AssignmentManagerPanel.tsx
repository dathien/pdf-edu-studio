import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Globe,
  HardDrive,
  Info,
  Link2,
  Send,
  Trash2,
} from 'lucide-react';
import {
  buildShareableWorksheetLink,
  exportStudentWorksheetPackage,
  getOnlineBackendConfig,
  triggerInteractiveDownload,
} from './interactiveEngine';
import { interactiveStorage } from './interactiveStorage';
import type {
  AssignmentRecord,
  GradedSubmissionRecord,
  TeacherWorksheetRecord,
} from '../../types/interactive';

interface AssignmentManagerPanelProps {
  teacherWorksheets: TeacherWorksheetRecord[];
  assignments: AssignmentRecord[];
  submissions: GradedSubmissionRecord[];
  onRefresh: () => Promise<void>;
  onOpenInAuthor: (tw: TeacherWorksheetRecord) => void;
  onOpenInGrade: (worksheetId: string) => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AssignmentManagerPanel: React.FC<AssignmentManagerPanelProps> = ({
  teacherWorksheets,
  assignments,
  submissions,
  onRefresh,
  onOpenInAuthor,
  onOpenInGrade,
  onNotify,
}) => {
  const backend = useMemo(() => getOnlineBackendConfig(), []);
  const [deliveryTab, setDeliveryTab] = useState<'offline' | 'online'>('offline');
  const [selectedWsId, setSelectedWsId] = useState<string>(
    teacherWorksheets[0]?.worksheetId || ''
  );
  const [className, setClassName] = useState('11A1');
  const [instructions, setInstructions] = useState(
    'Hoàn thành tất cả các câu hỏi trực tiếp trên tài liệu PDF, lưu bài thường xuyên và xuất tệp .pdfedu nộp lại cho giáo viên.'
  );
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [hostedPackageUrl, setHostedPackageUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedMaster = useMemo(
    () => teacherWorksheets.find((w) => w.worksheetId === selectedWsId) || teacherWorksheets[0] || null,
    [teacherWorksheets, selectedWsId]
  );

  const makeCode = (subjectLabel: string) => {
    const slug = subjectLabel
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BT-${slug || 'PDF'}-${rand}`;
  };

  const handleAssignOffline = async () => {
    if (!selectedMaster) {
      onNotify('Chưa có bài tập gốc nào. Hãy tạo và lưu bài tập ở mục "Tạo bài tập" trước.', 'warning');
      return;
    }
    try {
      const code = makeCode(selectedMaster.worksheet.subjectLabel);
      const updatedWs = {
        ...selectedMaster.worksheet,
        className: className.trim(),
        instructions: instructions.trim(),
        dueDate: dueDate || undefined,
      };
      const bytes = await exportStudentWorksheetPackage(updatedWs, selectedMaster.pdfBytes);
      const safeName = updatedWs.title
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 52);
      triggerInteractiveDownload(bytes, `${code}_${safeName}_HS.pdfedu`, 'application/octet-stream');

      const rec: AssignmentRecord = {
        assignmentId: `asg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        assignmentCode: code,
        worksheetId: selectedMaster.worksheetId,
        title: updatedWs.title,
        subjectLabel: updatedWs.subjectLabel,
        grade: updatedWs.grade,
        className: className.trim() || 'Chung',
        instructions: instructions.trim(),
        startTime: startTime || undefined,
        dueDate: dueDate || undefined,
        deliveryMode: 'offline',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await interactiveStorage.saveAssignment(rec);
      await onRefresh();
      onNotify(
        `Đã xuất gói bài tập Offline (${code}) không chứa đáp án giáo viên và lưu vào danh sách bài đã giao.`,
        'success'
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Không thể xuất gói giao bài Offline.', 'error');
    }
  };

  const handleCreateOnlineLink = async () => {
    if (!selectedMaster) {
      onNotify('Chưa có bài tập gốc nào để giao Online.', 'warning');
      return;
    }
    const trimmedUrl = hostedPackageUrl.trim();
    if (!trimmedUrl) {
      onNotify(
        'Cần nhập đường dẫn HTTPS thật tới tệp .pdfedu đã tải lên máy chủ/lưu trữ để tạo liên kết truy cập hợp lệ.',
        'warning'
      );
      return;
    }
    try {
      const code = makeCode(selectedMaster.worksheet.subjectLabel);
      const shareUrl = buildShareableWorksheetLink(trimmedUrl, code);
      setGeneratedLink(shareUrl);
      setGeneratedCode(code);

      const rec: AssignmentRecord = {
        assignmentId: `asg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        assignmentCode: code,
        worksheetId: selectedMaster.worksheetId,
        title: selectedMaster.worksheet.title,
        subjectLabel: selectedMaster.worksheet.subjectLabel,
        grade: selectedMaster.worksheet.grade,
        className: className.trim() || 'Chung',
        instructions: instructions.trim(),
        startTime: startTime || undefined,
        dueDate: dueDate || undefined,
        deliveryMode: 'online_link',
        hostedPackageUrl: trimmedUrl,
        shareableLink: shareUrl,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await interactiveStorage.saveAssignment(rec);
      await onRefresh();
      onNotify(`Đã tạo liên kết bài tập hợp lệ (${code}) trỏ tới tệp .pdfedu đã cấu hình.`, 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Đường dẫn tệp .pdfedu không hợp lệ.', 'error');
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`Đã sao chép ${label}.`, 'success');
    } catch {
      onNotify('Trình duyệt không cho phép tự sao chép. Thầy/cô hãy bôi đen và nhấn Ctrl+C / Cmd+C.', 'warning');
    }
  };

  const submissionCountByWorksheet = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of submissions) {
      map[s.worksheetId] = (map[s.worksheetId] || 0) + 1;
    }
    return map;
  }, [submissions]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F8F7] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Card: Create Offline / Online Assignment */}
        <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[21px] font-bold text-[#164E63] flex items-center gap-2">
                <Send className="w-5 h-5 text-[#087F70]" />
                <span>Giao bài tập PDF tương tác (Offline & Online)</span>
              </h2>
              <p className="text-[15px] text-slate-600 mt-0.5">
                Chọn bài tập đã duyệt, thiết lập lớp, hướng dẫn và thời hạn để phát gói Offline hoặc tạo liên kết truy cập thật.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeliveryTab('offline')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[15px] font-semibold cursor-pointer transition-colors ${
                  deliveryTab === 'offline'
                    ? 'bg-[#087F70] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Giao bài Offline</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryTab('online')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[15px] font-semibold cursor-pointer transition-colors ${
                  deliveryTab === 'online'
                    ? 'bg-[#164E63] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Giao bài Online</span>
              </button>
            </div>
          </div>

          {teacherWorksheets.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-[15px] text-amber-950">
              Chưa có bài tập gốc nào được lưu. Thầy/cô hãy vào mục <strong>Tạo bài tập</strong>, nạp PDF hoặc mẫu môn học rồi nhấn <strong>Lưu bản gốc GV</strong> trước khi giao bài.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="md:col-span-2 space-y-1">
                  <span className="block text-[15px] font-semibold text-slate-700">
                    Chọn bài tập đã hoàn thiện
                  </span>
                  <select
                    value={selectedMaster?.worksheetId || ''}
                    onChange={(e) => setSelectedWsId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900"
                  >
                    {teacherWorksheets.map((tw) => (
                      <option key={tw.worksheetId} value={tw.worksheetId}>
                        {tw.worksheet.title} ({tw.worksheet.subjectLabel} · Lớp {tw.worksheet.grade} · {tw.worksheet.questions.length} câu)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-[15px] font-semibold text-slate-700">Lớp giao bài</span>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="VD: 11A1, 12A2"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-1">
                  <span className="block text-[15px] font-semibold text-slate-700">
                    Thời gian bắt đầu (tùy chọn)
                  </span>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[15px] font-semibold text-slate-700">
                    Thời hạn nộp bài (tùy chọn)
                  </span>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[15px] font-semibold text-slate-700">
                    Hướng dẫn cho học sinh
                  </span>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px]"
                  />
                </label>
              </div>

              {deliveryTab === 'offline' ? (
                <div className="rounded-xl bg-[#F4F8F7] border border-teal-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-[15px] text-slate-700">
                    <div className="font-bold text-[#164E63]">
                      Xuất gói bài tập Offline (.pdfedu) — Không cần máy chủ
                    </div>
                    <p>
                      Gói xuất ra chứa PDF gốc, vùng tương tác, điểm tối đa, hướng dẫn và mã toàn vẹn SHA-256 — <strong>tuyệt đối không chứa đáp án giáo viên</strong>. Thầy/cô gửi tệp qua Zalo, Email, LMS hoặc USB.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAssignOffline}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất gói .pdfedu & Lưu lịch giao</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-start gap-2.5 text-[14.5px] text-[#164E63] bg-white rounded-lg border border-slate-200 p-3">
                    <Info className="w-5 h-5 text-[#087F70] shrink-0 mt-0.5" />
                    <div className="space-y-1 leading-relaxed">
                      <div className="font-bold">
                        Trạng thái máy chủ thu bài Online:{' '}
                        <span className={backend.configured ? 'text-emerald-700' : 'text-amber-700'}>
                          {backend.configured
                            ? `Đã cấu hình máy chủ (${backend.endpointUrl})`
                            : 'Chưa kết nối backend thu bài tự động'}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Ứng dụng <strong>không tạo liên kết giả</strong>. Để giao Online, thầy/cô xuất tệp <strong>.pdfedu</strong> (ở chế độ Offline) lên nơi lưu trữ HTTPS hợp lệ (máy chủ trường, thư mục tĩnh hoặc liên kết tải trực tiếp hỗ trợ CORS), sau đó dán đường dẫn thật vào ô dưới để tạo liên kết mở thẳng bài tập cho học sinh. Khi học sinh làm xong sẽ xuất tệp <strong>.pdfedu</strong> gửi lại giáo viên thu bài.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="url"
                      value={hostedPackageUrl}
                      onChange={(e) => setHostedPackageUrl(e.target.value)}
                      placeholder="Dán đường dẫn HTTPS thật tới tệp bài tập (.pdfedu), VD: https://school.edu.vn/bt/toan12.pdfedu"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateOnlineLink}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#164E63] hover:bg-[#103b4b] text-white font-semibold text-[15px] cursor-pointer shrink-0"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Tạo liên kết thật & Mã bài</span>
                    </button>
                  </div>

                  {generatedLink && generatedCode && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[15px] font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mã bài tập: {generatedCode}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(generatedLink, 'liên kết bài tập')}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[14px] font-semibold cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép liên kết</span>
                          </button>
                          <a
                            href={generatedLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-emerald-700 bg-white text-emerald-800 text-[14px] font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Mở thử</span>
                          </a>
                        </div>
                      </div>
                      <div className="font-mono text-[13px] text-emerald-950 break-all bg-white rounded border border-emerald-200 px-2.5 py-1.5">
                        {generatedLink}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Bottom Section: Quản lý bài đã giao (Section XXI) */}
        <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-[19px] font-bold text-[#164E63]">
              Quản lý bài đã giao ({assignments.length})
            </h3>
            <span className="text-[14.5px] text-slate-600">
              Số bài đã nhận được thống kê từ dữ liệu bài nộp thật đã nhập trên máy.
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-8 text-center text-[15px] text-slate-600">
              Chưa có bài tập nào được giao. Hãy xuất gói Offline hoặc tạo liên kết Online ở khung phía trên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[14.5px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[#164E63]">
                    <th className="py-2.5 pr-3 font-bold">Tên bài / Mã bài</th>
                    <th className="py-2.5 px-2 font-bold">Môn · Lớp</th>
                    <th className="py-2.5 px-2 font-bold">Hình thức</th>
                    <th className="py-2.5 px-2 font-bold">Ngày giao / Hạn</th>
                    <th className="py-2.5 px-2 font-bold">Trạng thái</th>
                    <th className="py-2.5 px-2 font-bold text-center">Đã nhận</th>
                    <th className="py-2.5 pl-2 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((asg) => {
                    const received = submissionCountByWorksheet[asg.worksheetId] || 0;
                    const master = teacherWorksheets.find((w) => w.worksheetId === asg.worksheetId);
                    return (
                      <tr key={asg.assignmentId} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-3">
                          <div className="font-bold text-slate-900">{asg.title}</div>
                          <div className="text-[13px] font-mono text-[#087F70]">
                            {asg.assignmentCode}
                          </div>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <div>{asg.subjectLabel}</div>
                          <div className="text-[13px] text-slate-500">
                            Khối {asg.grade} · {asg.className}
                          </div>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[13px] font-semibold ${
                              asg.deliveryMode === 'online_link'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-teal-50 text-[#087F70] border border-teal-200'
                            }`}
                          >
                            {asg.deliveryMode === 'online_link' ? 'Online (Liên kết)' : 'Offline (.pdfedu)'}
                          </span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap text-[13.5px]">
                          <div>Giao: {new Date(asg.createdAt).toLocaleDateString('vi-VN')}</div>
                          <div className="text-slate-500">
                            Hạn: {asg.dueDate ? new Date(asg.dueDate).toLocaleString('vi-VN') : 'Không giới hạn'}
                          </div>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={async () => {
                              await interactiveStorage.saveAssignment({
                                ...asg,
                                status: asg.status === 'active' ? 'closed' : 'active',
                              });
                              await onRefresh();
                            }}
                            className={`px-2 py-0.5 rounded text-[13px] font-semibold cursor-pointer ${
                              asg.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                            title="Nhấn để chuyển trạng thái Đang mở / Đã đóng"
                          >
                            {asg.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-[#164E63]">
                          {received}
                        </td>
                        <td className="py-3 pl-2">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {master && (
                              <button
                                type="button"
                                onClick={() => onOpenInAuthor(master)}
                                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                                title="Xem / Sửa đề bài"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {master && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const bytes = await exportStudentWorksheetPackage(
                                    master.worksheet,
                                    master.pdfBytes
                                  );
                                  triggerInteractiveDownload(
                                    bytes,
                                    `${asg.assignmentCode}_HS.pdfedu`,
                                    'application/octet-stream'
                                  );
                                  onNotify('Đã xuất lại gói bài tập Offline (.pdfedu).', 'success');
                                }}
                                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-teal-50 text-[#087F70] cursor-pointer"
                                title="Xuất lại gói Offline .pdfedu"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            {asg.shareableLink && (
                              <button
                                type="button"
                                onClick={() => copyText(asg.shareableLink!, 'liên kết Online')}
                                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-sky-50 text-sky-700 cursor-pointer"
                                title="Sao chép liên kết Online"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenInGrade(asg.worksheetId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#164E63] hover:bg-[#0f3b4c] text-white text-[13.5px] font-semibold cursor-pointer"
                              title="Thu bài & Chấm bài"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Thu & Chấm</span>
                            </button>
                            {confirmDeleteId === asg.assignmentId ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await interactiveStorage.deleteAssignment(asg.assignmentId);
                                  setConfirmDeleteId(null);
                                  await onRefresh();
                                }}
                                className="px-2 py-1 rounded bg-red-600 text-white text-[12.5px] font-semibold cursor-pointer"
                              >
                                Xác nhận xóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(asg.assignmentId)}
                                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 cursor-pointer"
                                title="Xóa lịch giao bài"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
