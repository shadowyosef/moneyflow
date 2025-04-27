// src/app/settings/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { saveBackup, loadBackup } from "@/lib/settings";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [backupData, setBackupData] = useState<string>("");

  useEffect(() => {
    const fetchBackup = async () => {
      const backup = await saveBackup();
      setBackupData(JSON.stringify(backup, null, 2));
    };
    fetchBackup();
  }, []);

  const handleExportBackup = async () => {
    const backup = await saveBackup();
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "money-flow-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup exported successfully!" });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        if (typeof content === "string") {
          await loadBackup(JSON.parse(content));
          toast({ title: "Backup imported successfully!" });
        }
      } catch (error) {
        toast({ title: "Error importing backup", description: String(error) });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExportBackup}>Export Backup</Button>
          <input
            type="file"
            accept="application/json"
            onChange={handleImportBackup}
            className="mt-4 block"
          />
          <pre className="p-4 bg-gray-100 rounded text-xs overflow-x-auto">{backupData}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
