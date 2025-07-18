import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Tile } from '@/types/mahjong'
import { getTileDisplayName, getTileEmoji } from '@/utils/mahjongTiles'
import { playTileClick, initializeSounds } from '@/utils/soundEffects'

interface MahjongTileProps {
  tile: Tile
  isSelected?: boolean
  isDisabled?: boolean
  isDiscarded?: boolean
  isRecentDiscard?: boolean
  isConcealed?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

export function MahjongTile({
  tile,
  isSelected = false,
  isDisabled = false,
  isDiscarded = false,
  isRecentDiscard = false,
  isConcealed = false,
  size = 'md',
  onClick,
  className
}: MahjongTileProps) {
  const sizeClasses = {
    sm: 'w-8 h-12 text-xs',
    md: 'w-12 h-16 text-sm',
    lg: 'w-16 h-20 text-base'
  }

  const getSuitColor = (tile: Tile) => {
    if (tile.suit === 'circles') return 'text-blue-400'
    if (tile.suit === 'bamboos') return 'text-green-400'
    if (tile.suit === 'characters') return 'text-red-400'
    if (tile.suit === 'winds') return 'text-yellow-400'
    if (tile.suit === 'dragons') {
      if (tile.dragon === 'red') return 'text-red-500'
      if (tile.dragon === 'green') return 'text-green-500'
      return 'text-gray-300'
    }
    if (tile.suit === 'flowers' || tile.suit === 'seasons') return 'text-pink-400'
    return 'text-gray-400'
  }

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      animate={{
        y: isSelected ? -8 : 0,
        rotateY: isConcealed ? 180 : 0
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative cursor-pointer select-none',
        sizeClasses[size],
        isDisabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={!isDisabled ? () => {
        initializeSounds() // Initialize sounds on first interaction
        playTileClick()
        onClick?.()
      } : undefined}
      title={getTileDisplayName(tile)}
    >
      <div
        className={cn(
          'w-full h-full rounded-lg border-2 flex flex-col items-center justify-center font-bold transition-all duration-200 mahjong-tile-shadow',
          isConcealed 
            ? 'bg-gradient-to-br from-primary/20 to-primary/40 border-primary/50' 
            : 'bg-gradient-to-br from-card to-card/80 border-border',
          isSelected && 'border-accent shadow-lg shadow-accent/30',
          isDiscarded && !isRecentDiscard && 'opacity-60 grayscale',
          isRecentDiscard && 'border-red-400 shadow-lg shadow-red-400/50 ring-2 ring-red-400/30 animate-pulse',
          tile.isRecentlyDrawn && 'border-green-400 shadow-lg shadow-green-400/50 ring-2 ring-green-400/30',
          tile.isRecentlyDiscarded && 'border-orange-400 shadow-lg shadow-orange-400/50 ring-2 ring-orange-400/30',
          !isDisabled && 'hover:border-accent/50'
        )}
      >
        {!isConcealed ? (
          <>
            <div className={cn('text-2xl mb-1', getSuitColor(tile))}>
              {getTileEmoji(tile)}
            </div>
            {tile.value && (
              <div className="text-xs font-bold text-muted-foreground">
                {tile.value}
              </div>
            )}
            {/* Show flower/season name for bonus tiles */}
            {tile.isBonus && (tile.flower || tile.season) && (
              <div className="text-xs font-bold text-pink-400 capitalize">
                {tile.flower || tile.season}
              </div>
            )}
            {tile.isBonus && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-pink-400 rounded-full" />
            )}
          </>
        ) : (
          <div className="text-primary/60 text-lg">🀫</div>
        )}
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background"
        />
      )}
    </motion.div>
  )
}