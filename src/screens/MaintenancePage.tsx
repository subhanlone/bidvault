import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { api } from '../services/api';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [supportEmail, setSupportEmail] = useState('support@bidvault.tech');

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const s = await api.get<{ maintenanceMode: boolean; supportEmail: string }>('/settings/public');
        if (!active) return;
        if (s.supportEmail) setSupportEmail(s.supportEmail);
        if (!s.maintenanceMode) navigate('/', { replace: true });
      } catch {
        // stay on the maintenance page
      }
    };
    void check();
    const t = setInterval(() => void check(), 15_000);
    return () => { active = false; clearInterval(t); };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-[420px]">
        <div className="bg-primary-surface size-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Wrench size={28} className="text-primary" />
        </div>
        <h1 className="font-extrabold text-[24px] text-navy mb-2">We'll be right back</h1>
        <p className="text-[14px] text-muted mb-4">
          BidVault is undergoing scheduled maintenance. Thanks for your patience — this page refreshes
          automatically when we're back online.
        </p>
        <a href={`mailto:${supportEmail}`} className="text-[13px] font-bold text-primary hover:underline">
          Contact support
        </a>
      </div>
    </div>
  );
}
