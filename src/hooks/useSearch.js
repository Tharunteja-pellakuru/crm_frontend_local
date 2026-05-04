import { useState, useEffect } from "react";

/**
 * useSearch
 * A reusable hook that manages search state and automatically resets
 * pagination whenever the search term changes.
 *
 * @param {Function} setCurrentPage - The page-reset setter from the parent component
 * @returns {{ searchTerm: string, setSearchTerm: Function }}
 *
 * Usage:
 *   const { searchTerm, setSearchTerm } = useSearch(setCurrentPage);
 */
export function useSearch(setCurrentPage) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (setCurrentPage) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  return { searchTerm, setSearchTerm };
}
