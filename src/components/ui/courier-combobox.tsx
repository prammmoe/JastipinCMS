"use client";

import { KeyboardEvent, useId, useMemo, useState } from "react";
import { Check, Truck } from "lucide-react";
import { filterCouriers, matchCourier } from "@/lib/couriers";

export function CourierCombobox({ initialValue = "" }: { initialValue?: string }) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(() => filterCouriers(query), [query]);

  function choose(courier: string) {
    setQuery(courier);
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

  return (
    <div
      className="courier-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="label" htmlFor={inputId}>
        Kurir
      </label>
      <input
        id={inputId}
        className="input"
        name="courier"
        value={query}
        placeholder="Pilih atau ketik kurir"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const value = event.target.value;
          const matched = matchCourier(value);
          setQuery(matched ?? value);
          setOpen(!matched);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <div className="combobox-menu" id={listboxId} role="listbox">
          <div className="combobox-caption">Pilih kurir atau isi bebas</div>
          {suggestions.length ? (
            suggestions.map((courier, index) => (
              <button
                id={`${listboxId}-${index}`}
                key={courier}
                className="combobox-option"
                data-active={index === activeIndex}
                type="button"
                role="option"
                aria-selected={query === courier}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(courier)}
              >
                <strong>{courier}</strong>
                {query === courier || index === activeIndex ? (
                  <Check size={15} />
                ) : null}
              </button>
            ))
          ) : (
            <div className="combobox-empty">
              <Truck size={16} />
              <span>
                <strong>Kurir lainnya</strong>
                Nilai yang diketik tetap dapat disimpan.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
