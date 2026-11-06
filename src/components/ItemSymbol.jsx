import React from 'react'
import BeamIcon from './BeamIcon'
import { Boxes } from 'lucide-react'

/**
 * ItemSymbol
 * Renders the dedicated symbolic SVG icon for a warehouse item or category.
 * Automatically chooses the right symbolic vector based on SKU or Category.
 */
export default function ItemSymbol({
  item,
  size = 'md',
  variant = 'isometric',
  className = '',
  iconClassName = '',
}) {
  const isBeam =
    item?.sku?.startsWith('PTR-') ||
    item?.category_slug === 'concrete-beams' ||
    item?.category_slug === 'poutrelle' ||
    item?.category_id === '33333333-3333-3333-3333-333333333333' ||
    item?.icon === 'BeamIcon'

  // Size configurations
  const sizeStyles = {
    xs: {
      container: 'w-6 h-6 rounded-md',
      icon: 'w-4 h-4',
    },
    sm: {
      container: 'w-8 h-8 rounded-lg',
      icon: 'w-5 h-5',
    },
    md: {
      container: 'w-11 h-11 rounded-xl',
      icon: 'w-7 h-7',
    },
    lg: {
      container: 'w-14 h-14 rounded-2xl',
      icon: 'w-9 h-9',
    },
    xl: {
      container: 'w-16 h-16 rounded-2xl',
      icon: 'w-11 h-11',
    },
  }

  const currentSize = sizeStyles[size] || sizeStyles.md

  return (
    <div
      className={`shrink-0 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 shadow-2xs ${currentSize.container} ${className}`}
    >
      {isBeam ? (
        <BeamIcon
          variant={variant}
          className={`${currentSize.icon} ${iconClassName}`}
        />
      ) : (
        <Boxes className={`${currentSize.icon} ${iconClassName}`} />
      )}
    </div>
  )
}

