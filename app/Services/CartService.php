<?php

namespace App\Services;

use App\Support\MemoryStore;

/**
 * Lógica de negocio del carrito que vive completamente en memoria.
 */
class CartService
{
    /** @var MemoryStore */
    protected $carts;

    /** @var MemoryStore */
    protected $items;

    /** @var MemoryStore */
    protected $articles;

    public function __construct()
    {
        $this->carts    = MemoryStore::for(MemoryStore::CARTS);
        $this->items    = MemoryStore::for(MemoryStore::CART_ITEMS);
        $this->articles = MemoryStore::for(MemoryStore::ARTICLES);
    }

    /**
     * Recalcula y persiste el costo_total del carrito sumando el costo de los
     * artículos de sus items.
     *
     * @return array<string, mixed>|null  el carrito actualizado o null si no existe
     */
    public function recalculateTotal(int $cartId): ?array
    {
        if (! $this->carts->exists($cartId)) {
            return null;
        }

        $total = 0.0;

        foreach ($this->items->where('cart_id', $cartId) as $item) {
            $article = $this->articles->find($item['article_id']);

            if ($article !== null) {
                $total += (float) $article['costo'];
            }
        }

        return $this->carts->update($cartId, ['costo_total' => round($total, 2)]);
    }

    /**
     * Devuelve el carrito con sus items (y el artículo de cada uno) embebidos.
     *
     * @return array<string, mixed>|null
     */
    public function withItems(int $cartId): ?array
    {
        $cart = $this->carts->find($cartId);

        if ($cart === null) {
            return null;
        }

        $cart['items'] = array_map(function ($item) {
            $item['article'] = $this->articles->find($item['article_id']);

            return $item;
        }, $this->items->where('cart_id', $cartId));

        return $cart;
    }

    /**
     * Elimina el carrito junto con todos sus items (borrado en cascada).
     */
    public function deleteWithItems(int $cartId): bool
    {
        if (! $this->carts->exists($cartId)) {
            return false;
        }

        foreach ($this->items->where('cart_id', $cartId) as $item) {
            $this->items->delete($item['id']);
        }

        return $this->carts->delete($cartId);
    }
}
