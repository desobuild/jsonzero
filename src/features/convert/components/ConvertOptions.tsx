/**
 * JSONZero — ConvertOptions Component
 *
 * Configurable options bar tailored for each conversion target
 * (CSV delimiters/headers, TypeScript/Dart root class name, Schema draft badge).
 */

import React from 'react'
import type { ConvertType, ConvertOptionsState } from '../types'
import { CONVERT_DEFINITIONS } from '../utils'

export interface ConvertOptionsProps {
  selectedConvert: ConvertType
  options: ConvertOptionsState
  onOptionsChange: React.Dispatch<React.SetStateAction<ConvertOptionsState>>
}

export const ConvertOptions: React.FC<ConvertOptionsProps> = ({
  selectedConvert,
  options,
  onOptionsChange,
}) => {
  const definition = CONVERT_DEFINITIONS[selectedConvert]

  return (
    <div
      id="convert-options-bar"
      data-testid="convert-options-bar"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated/40 px-3 py-1.5 text-xs"
    >
      {/* Description text */}
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="font-semibold text-text-primary">
          {definition.label}:
        </span>
        <span className="hidden sm:inline text-text-muted">
          {definition.description}
        </span>
      </div>

      {/* Target-specific options */}
      <div className="flex flex-wrap items-center gap-3">
        {/* CSV Options */}
        {selectedConvert === 'csv' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="csv-delimiter-select"
                className="text-3xs font-medium text-text-muted"
              >
                Delimiter:
              </label>
              <select
                id="csv-delimiter-select"
                data-testid="csv-delimiter-select"
                aria-label="CSV Delimiter"
                value={options.csvDelimiter}
                onChange={(e) =>
                  onOptionsChange((prev) => ({
                    ...prev,
                    csvDelimiter: e.target.value as ',' | '\t' | ';',
                  }))
                }
                className="h-6 rounded border border-border bg-surface px-1.5 text-3xs font-medium text-text-primary outline-none focus-visible:border-accent"
              >
                <option value=",">Comma (,)</option>
                <option value="	">Tab (\t)</option>
                <option value=";">Semicolon (;)</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-3xs text-text-secondary">
              <input
                type="checkbox"
                data-testid="csv-header-checkbox"
                aria-label="Include Header in CSV"
                checked={options.csvIncludeHeader}
                onChange={(e) =>
                  onOptionsChange((prev) => ({
                    ...prev,
                    csvIncludeHeader: e.target.checked,
                  }))
                }
                className="rounded border-border text-accent focus:ring-accent"
              ></input>
              <span>Header</span>
            </label>
          </div>
        )}

        {/* TypeScript Options */}
        {selectedConvert === 'typescript' && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="ts-root-name-input"
              className="text-3xs font-medium text-text-muted"
            >
              Root Name:
            </label>
            <input
              id="ts-root-name-input"
              data-testid="ts-root-name-input"
              aria-label="TypeScript Root Type Name"
              type="text"
              value={options.tsRootName}
              onChange={(e) =>
                onOptionsChange((prev) => ({
                  ...prev,
                  tsRootName: e.target.value,
                }))
              }
              className="h-6 w-24 rounded border border-border bg-surface px-1.5 font-mono text-3xs text-text-primary outline-none focus-visible:border-accent"
            />
          </div>
        )}

        {/* Dart Options */}
        {selectedConvert === 'dart' && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="dart-root-name-input"
              className="text-3xs font-medium text-text-muted"
            >
              Model Name:
            </label>
            <input
              id="dart-root-name-input"
              data-testid="dart-root-name-input"
              aria-label="Dart Root Model Name"
              type="text"
              value={options.dartRootName}
              onChange={(e) =>
                onOptionsChange((prev) => ({
                  ...prev,
                  dartRootName: e.target.value,
                }))
              }
              className="h-6 w-24 rounded border border-border bg-surface px-1.5 font-mono text-3xs text-text-primary outline-none focus-visible:border-accent"
            />
          </div>
        )}

        {/* JSON Schema Badge */}
        {selectedConvert === 'json-schema' && (
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-3xs font-medium text-accent">
            Draft 2020-12
          </span>
        )}

        {/* Table summary tip */}
        {selectedConvert === 'table' && (
          <span className="text-3xs text-text-muted">
            Click cells to inspect & copy
          </span>
        )}
      </div>
    </div>
  )
}
