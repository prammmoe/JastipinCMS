"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { api } from "@/lib/api-client/client";
import { ComboboxOptionsSkeleton } from "@/components/ui/skeleton";

type CustomerOption = {
  id: string;
  code: string;
  name: string;
};

export function CustomerFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [suggestions, setSuggestions] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const resolved = useRef(false);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      setQuery("");
      return;
    }
    if (resolved.current && selected?.id === value) return;
    let current = true;
    api
      .get<CustomerOption>(`/api/v1/customers/${value}`)
      .then((row) => {
        if (!current) return;
        resolved.current = true;
        setSelected(row);
        setQuery(row.name);
      })
      .catch(() => {
        if (current) setQuery("");
      });
    return () => {
      current = false;
    };
  }, [value, selected]);

  useEffect(() => {
    const term = query.trim();
    if (selected || term.length < 2) return;

    let current = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      api
        .get<CustomerOption[]>(
          `/api/v1/customers/suggestions?search=${encodeURIComponent(term)}`,
        )
        .then((rows) => {
          if (!current) return;
          setSuggestions(rows);
          setActiveIndex(-1);
          setOpen(true);
        })
        .catch(() => {
          if (current) setSuggestions([]);
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 180);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [query, selected]);

  function choose(customer: CustomerOption) {
    setSelected(customer);
    setQuery(customer.name);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onChange(customer.id);
  }

  function clear() {
    resolved.current = false;
    setSelected(null);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onChange("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const canSuggest = query.trim().length >= 2 && !selected;

  return (
    <label>
      <span className="label">Customer</span>
      <span style={{ position: "relative", display: "block" }}>
        <Search
          size={16}
          style={{ position: "absolute", left: 12, top: 12, color: "var(--neutral-500)" }}
        />
        <input
          id={inputId}
          className="input"
          value={query}
          placeholder="Cari customer..."
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open && canSuggest}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setSelected(null);
            setSuggestions([]);
            setLoading(nextQuery.trim().length >= 2);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          style={{ paddingLeft: 38, paddingRight: selected ? 34 : 12 }}
        />
        {selected && (
          <button
            type="button"
            aria-label="Hapus filter customer"
            onClick={clear}
            style={{
              position: "absolute",
              right: 8,
              top: 7,
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--neutral-500)",
            }}
          >
            <X size={15} />
          </button>
        )}
      </span>

      {open && canSuggest && (
        <div className="combobox-menu" id={listboxId} role="listbox">
          {loading ? (
            <ComboboxOptionsSkeleton />
          ) : suggestions.length ? (
            suggestions.map((customer, index) => (
              <button
                id={`${listboxId}-${index}`}
                key={customer.id}
                className="combobox-option"
                data-active={index === activeIndex}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(customer)}
              >
                <span>
                  <strong>{customer.name}</strong>
                  <small>{customer.code}</small>
                </span>
                {index === activeIndex && <Check size={15} />}
              </button>
            ))
          ) : (
            <div className="combobox-empty">
              <span>Tidak ada customer yang cocok.</span>
            </div>
          )}
        </div>
      )}
    </label>
  );
}
