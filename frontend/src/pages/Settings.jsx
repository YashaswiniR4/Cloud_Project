import React from 'react';
import { Settings as SettingsIcon, Shield, Server, Lock, Cloud, Database } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          <span>Platform Settings & Architecture Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          AWS Infrastructure settings, Zero Trust IAM Guardrails, and S3 WORM Retention policies.
        </p>
      </div>

      <div className="space-y-4">
        {/* AWS Settings Card */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span>AWS Infrastructure & Region Configuration</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">AWS Target Region</label>
              <input type="text" value="us-east-1" readOnly className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">CloudFormation Stack Name</label>
              <input type="text" value="threat-intel-honeypot-stack" readOnly className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">S3 WORM Vault Bucket</label>
              <input type="text" value="threat-intel-worm-audit-vault" readOnly className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">KMS SSE Master Key ARN</label>
              <input type="text" value="arn:aws:kms:us-east-1:123456789012:key/threat-intel-key" readOnly className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono" />
            </div>
          </div>
        </div>

        {/* Security Policy Card */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Zero Trust IAM & Containment Rules</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <p className="font-semibold text-slate-200">Automated Lambda SG Revocation</p>
                <p className="text-[11px] text-slate-500">Revokes ingress for IPs with threat score &gt; 75.0</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">ENABLED</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <p className="font-semibold text-slate-200">Automated IAM Key Disabling</p>
                <p className="text-[11px] text-slate-500">Deactivates AWS access keys for rogue user principals</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">ENABLED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
