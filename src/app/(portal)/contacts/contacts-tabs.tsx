"use client";

import { useState } from "react";
import { Users, Building2 } from "lucide-react";
import { PersonsList } from "./persons-list";
import { GroupsList } from "./groups-list";

export function ContactsTabs() {
  const [activeTab, setActiveTab] = useState<'persons' | 'groups'>('persons');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('persons')}
            className={`
              flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'persons'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <Users className="h-4 w-4" />
            Personen
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`
              flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'groups'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <Building2 className="h-4 w-4" />
            Gruppen
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'persons' && <PersonsList />}
        {activeTab === 'groups' && <GroupsList />}
      </div>
    </div>
  );
}