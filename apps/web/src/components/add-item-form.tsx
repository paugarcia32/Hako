'use client';

export function AddItemForm() {
  return (
    <form>
      <input type="url" name="url" placeholder="Paste a URL..." />
      <button type="submit">Add</button>
    </form>
  );
}
