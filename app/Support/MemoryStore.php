<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Repositorio en memoria (sin base de datos).
 *
 * Cada "colección" (users, articles, carts, cart_items) se comporta como una
 * tabla: un array asociativo indexado por id que se guarda con la fachada
 * Cache. Al usar el driver "file", el estado persiste entre distintas
 * peticiones HTTP, permitiendo probar los CRUD de forma realista.
 */
class MemoryStore
{
    /** Nombres de las colecciones disponibles. */
    public const USERS      = 'users';
    public const ARTICLES   = 'articles';
    public const CARTS      = 'carts';
    public const CART_ITEMS = 'cart_items';

    /** @var string */
    protected $collection;

    public function __construct(string $collection)
    {
        $this->collection = $collection;
    }

    /**
     * Fábrica cómoda: MemoryStore::for(MemoryStore::USERS).
     */
    public static function for(string $collection): self
    {
        return new static($collection);
    }

    /* -------------------------------------------------------------------- */
    /*  Claves internas de cache                                            */
    /* -------------------------------------------------------------------- */

    protected function recordsKey(): string
    {
        return "memory_store:{$this->collection}:records";
    }

    protected function sequenceKey(): string
    {
        return "memory_store:{$this->collection}:sequence";
    }

    /**
     * @return array<int, array<string, mixed>> registros indexados por id
     */
    protected function records(): array
    {
        return Cache::get($this->recordsKey(), []);
    }

    protected function persist(array $records): void
    {
        Cache::forever($this->recordsKey(), $records);
    }

    /* -------------------------------------------------------------------- */
    /*  Operaciones CRUD                                                    */
    /* -------------------------------------------------------------------- */

    /**
     * Devuelve todos los registros como lista (array reindexado).
     *
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        return array_values($this->records());
    }

    /**
     * Busca un registro por id.
     *
     * @param  int|string  $id
     * @return array<string, mixed>|null
     */
    public function find($id): ?array
    {
        $records = $this->records();

        return $records[(int) $id] ?? null;
    }

    /**
     * @param  int|string  $id
     */
    public function exists($id): bool
    {
        return $this->find($id) !== null;
    }

    /**
     * Crea un registro asignando un id autoincremental.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function create(array $attributes): array
    {
        $records = $this->records();
        $id = $this->nextId();

        // El id siempre va primero para una salida JSON limpia.
        $record = array_merge(['id' => $id], $attributes);

        $records[$id] = $record;
        $this->persist($records);

        return $record;
    }

    /**
     * Actualiza (parcialmente) un registro existente.
     *
     * @param  int|string  $id
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    public function update($id, array $attributes): ?array
    {
        $records = $this->records();
        $id = (int) $id;

        if (! isset($records[$id])) {
            return null;
        }

        // Nunca se permite cambiar el id.
        unset($attributes['id']);

        $records[$id] = array_merge($records[$id], $attributes);
        $this->persist($records);

        return $records[$id];
    }

    /**
     * Elimina un registro. Devuelve true si existía.
     *
     * @param  int|string  $id
     */
    public function delete($id): bool
    {
        $records = $this->records();
        $id = (int) $id;

        if (! isset($records[$id])) {
            return false;
        }

        unset($records[$id]);
        $this->persist($records);

        return true;
    }

    /* -------------------------------------------------------------------- */
    /*  Utilidades para relaciones y validación                             */
    /* -------------------------------------------------------------------- */

    /**
     * Filtra registros por el valor de un atributo (para relaciones simples).
     *
     * @param  mixed  $value
     * @return array<int, array<string, mixed>>
     */
    public function where(string $attribute, $value): array
    {
        $matches = array_filter($this->records(), static function ($record) use ($attribute, $value) {
            return isset($record[$attribute]) && $record[$attribute] == $value;
        });

        return array_values($matches);
    }

    /**
     * Ids existentes (útil para reglas de validación tipo "in").
     *
     * @return array<int, int>
     */
    public function ids(): array
    {
        return array_map('intval', array_keys($this->records()));
    }

    public function count(): int
    {
        return count($this->records());
    }

    /**
     * Devuelve el siguiente id autoincremental y lo persiste.
     */
    public function nextId(): int
    {
        $next = ((int) Cache::get($this->sequenceKey(), 0)) + 1;
        Cache::forever($this->sequenceKey(), $next);

        return $next;
    }

    /**
     * Vacía por completo la colección (registros + secuencia).
     */
    public function truncate(): void
    {
        Cache::forget($this->recordsKey());
        Cache::forget($this->sequenceKey());
    }
}
