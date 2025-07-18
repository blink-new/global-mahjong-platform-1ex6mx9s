import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MahjongTile } from './MahjongTile'
import { Tile } from '@/types/mahjong'
import { X, Eye, History } from 'lucide-react'

interface DiscardPileViewerProps {
  isOpen: boolean
  onClose: () => void
  discardPile: Tile[]
  playerDiscards: { [playerId: string]: Tile[] }
  playerNames: { [playerId: string]: string }
}

export function DiscardPileViewer({ 
  isOpen, 
  onClose, 
  discardPile, 
  playerDiscards,
  playerNames 
}: DiscardPileViewerProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | string>('all')

  const tabs = [
    { id: 'all', label: 'All Discards', count: discardPile.length },
    ...Object.keys(playerDiscards).map(playerId => ({
      id: playerId,
      label: playerNames[playerId] || 'Unknown',
      count: playerDiscards[playerId]?.length || 0
    }))
  ]

  const getDisplayTiles = () => {
    if (selectedTab === 'all') {
      return discardPile
    }
    return playerDiscards[selectedTab] || []
  }

  const groupTilesBySuit = (tiles: Tile[]) => {
    const groups: { [key: string]: Tile[] } = {
      'Characters': [],
      'Circles': [],
      'Bamboos': [],
      'Winds': [],
      'Dragons': [],
      'Flowers': [],
      'Seasons': []
    }

    tiles.forEach(tile => {
      if (tile.suit === 'characters') groups['Characters'].push(tile)
      else if (tile.suit === 'circles') groups['Circles'].push(tile)
      else if (tile.suit === 'bamboos') groups['Bamboos'].push(tile)
      else if (tile.wind) groups['Winds'].push(tile)
      else if (tile.dragon) groups['Dragons'].push(tile)
      else if (tile.flower) groups['Flowers'].push(tile)
      else if (tile.season) groups['Seasons'].push(tile)
    })

    return groups
  }

  const displayTiles = getDisplayTiles()
  const groupedTiles = groupTilesBySuit(displayTiles)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-primary" />
                    <span>Discard History</span>
                    <Badge variant="secondary" className="ml-2">
                      {displayTiles.length} tiles
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="flex items-center space-x-2 mt-4 overflow-x-auto">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={selectedTab === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab(tab.id)}
                      className="flex items-center space-x-2 whitespace-nowrap"
                    >
                      <span>{tab.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tab.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent className="overflow-y-auto max-h-[60vh]">
                {displayTiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tiles discarded yet</p>
                    <p className="text-sm">Discarded tiles will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedTiles).map(([suitName, tiles]) => {
                      if (tiles.length === 0) return null
                      
                      return (
                        <div key={suitName}>
                          <div className="flex items-center space-x-2 mb-3">
                            <h3 className="font-semibold text-sm">{suitName}</h3>
                            <Badge variant="outline" className="text-xs">
                              {tiles.length} tiles
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
                            {tiles.map((tile, index) => (
                              <motion.div
                                key={`${tile.id}-${index}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className="relative"
                              >
                                <MahjongTile 
                                  tile={tile} 
                                  size="sm" 
                                  isDiscarded
                                  className="hover:scale-110 transition-transform cursor-pointer"
                                />
                                {selectedTab === 'all' && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center text-white font-bold"
                                    style={{
                                      backgroundColor: getPlayerColor(tile.discardedBy || '')
                                    }}
                                  >
                                    {getPlayerInitial(tile.discardedBy || '')}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Legend for player colors when showing all discards */}
                {selectedTab === 'all' && Object.keys(playerDiscards).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2">Player Legend</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(playerDiscards).map((playerId) => (
                        <div key={playerId} className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-bold"
                            style={{ backgroundColor: getPlayerColor(playerId) }}
                          >
                            {getPlayerInitial(playerId)}
                          </div>
                          <span className="text-sm">{playerNames[playerId] || 'Unknown'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper functions for player identification
function getPlayerColor(playerId: string): string {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  const hash = playerId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return colors[Math.abs(hash) % colors.length]
}

function getPlayerInitial(playerId: string): string {
  if (!playerId) return '?'
  return playerId.charAt(0).toUpperCase()
}