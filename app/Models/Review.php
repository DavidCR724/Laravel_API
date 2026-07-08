<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Reseña de un artículo hecha por un cliente.
 *
 * Se asocia al artículo (article_id) y al usuario que la escribe (user_id),
 * e incluye una calificación (1-5) y una descripción.
 */
class Review extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'article_id',
        'user_id',
        'calificacion',
        'descripcion',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'calificacion' => 'integer',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
