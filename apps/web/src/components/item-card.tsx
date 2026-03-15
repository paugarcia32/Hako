import type { Item } from '@inkbox/types';

type ItemCardProps = {
  item: Item;
};

export function ItemCard({ item }: ItemCardProps) {
  return (
    <article>
      <h2>{item.title ?? item.url}</h2>
      {item.description && <p>{item.description}</p>}
    </article>
  );
}
