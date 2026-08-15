"use client";

import { KeyboardEvent, useEffect, useId, useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { api } from "@/lib/api-client/client";

type CustomerOption = {
  id: string;
  code: string;
  name: string;
};

export function CustomerCombobox() {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [suggestions, setSuggestions] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const term = query.trim();
    if (selected || term.length < 2) return;

    let current = true;
    const timer = window.setTimeout(() => {
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
    <div
      className="customer-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="label" htmlFor={inputId}>
        Customer
      </label>
      <input
        id={inputId}
        className="input"
        name="customerName"
        value={query}
        placeholder="Ketik nama customer"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open && canSuggest}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        onFocus={() => {
          if (canSuggest) setOpen(true);
        }}
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
      />
      <input type="hidden" name="customerId" value={selected?.id ?? ""} />

      {open && canSuggest && (
        <div className="combobox-menu" id={listboxId} role="listbox">
          {loading ? (
            <div className="combobox-empty">Mencari customer...</div>
          ) : suggestions.length ? (
            <>
              <div className="combobox-caption">Customer yang menyerupai</div>
              {suggestions.map((customer, index) => (
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
              ))}
            </>
          ) : (
            <div className="combobox-empty">
              <UserPlus size={16} />
              <span>
                <strong>Customer baru</strong>
                Nama ini akan dibuat saat paket disimpan.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
