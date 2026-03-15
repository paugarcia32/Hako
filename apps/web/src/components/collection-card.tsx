import type { Collection } from '@inkbox/types';

type CollectionCardProps = {
  collection: Collection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <article>
      <h2>{collection.name}</h2>
      {collection.description && <p>{collection.description}</p>}
      <span>{collection.itemCount} items</span>
    </article>
  );
}
