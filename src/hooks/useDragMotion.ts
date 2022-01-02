import { useState, useEffect, CSSProperties } from 'react'
import { DropTargetMonitor } from 'react-dnd'
import { sleep } from '@/services/util'

import { DragMotionState, MOTION_TYPE, MotionType } from '@/services/state'

import { DragItem } from '@/components/DraggableListItem'

export const MotionDurationMS = 5000

export type DragMotionProps = {
  motionType: MotionType
  top: number
  marginLeft?: string | number
}

export function useDragMotion(
  props: DragMotionProps,
  hasChildren?: boolean
): CSSProperties {
  const [motionStyles, setMotionStyles] = useState<CSSProperties>({})
  props = props || { top: null, motionType: null }

  // Apply motion animations.
  useEffect(() => {
    if (props.top == null || props.top === 0) {
      setMotionStyles({})
      return
    }
    if (hasChildren && props.motionType === MOTION_TYPE.SLIDE) {
      setMotionStyles({})
      return
    }

    // initial state
    const styles: CSSProperties = { top: 0 }
    if (props.motionType === MOTION_TYPE.FADE_IN) {
      styles.opacity = 0
    }
    setMotionStyles(styles)
    void sleep(1).then(() => {
      // enter animateion
      const styles: CSSProperties = { top: props.top }
      if (props.motionType === MOTION_TYPE.SLIDE) {
        styles.transition = `top ${MotionDurationMS}ms ease-out`
      } else if (props.motionType === MOTION_TYPE.FADE_IN) {
        styles.transition = `opacity ${MotionDurationMS}ms ease-out`
        styles.opacity = 1
      }
      if (props.marginLeft) {
        styles.marginLeft = props.marginLeft
      }
      setMotionStyles(styles)
    })
  }, [props.top, props.motionType, props.marginLeft, hasChildren])

  return motionStyles
}

type useMotionCalcProps = {
  item: DragItem
  monitor: DropTargetMonitor
  dragIndex: number
  hoverIndex: number
  dropTargetRect: DOMRect
  dropAtTopOfList: boolean
  isListTop: boolean
  marginLeft: string | number
}

export function useMotionCalculator(): (
  args: useMotionCalcProps,
) => DragMotionState[] {
  return ({
    item,
    monitor,
    dragIndex,
    hoverIndex,
    dropTargetRect,
    dropAtTopOfList,
    isListTop,
    marginLeft,
  }: useMotionCalcProps) => {
    const newMotions: DragMotionState[] = []

    // Element dragged
    const dragItemHeight = item.height
    const dragItemTop = monitor.getInitialSourceClientOffset()?.y
    let dropY: number
    if (dragIndex < hoverIndex) {
      // drog to down
      dropY = dropTargetRect.bottom - (dragItemTop + dragItemHeight)
    } else {
      // drog to up
      dropY = dropTargetRect.bottom - dragItemTop
      if (isListTop && dropAtTopOfList) {
        dropY = dropTargetRect.top - dragItemTop
      }
    }
    newMotions.push({
      line: dragIndex,
      props: { top: dropY, motionType: MOTION_TYPE.FADE_IN },
    })
    if (marginLeft !== 0) {
      newMotions[newMotions.length - 1].props.marginLeft = marginLeft
    }

    // Elements between drag and drop
    if (dragIndex < hoverIndex) {
      // drog to down
      for (let i = dragIndex + 1 + item.childrenCount; i <= hoverIndex; i++) {
        newMotions.push({
          line: i,
          props: {
            top: -dragItemHeight,
            motionType: MOTION_TYPE.SLIDE,
          },
        })
      }
    } else {
      // drog to up
      for (let i = dragIndex - 1; i > hoverIndex; i--) {
        newMotions.push({
          line: i,
          props: {
            top: dragItemHeight,
            motionType: MOTION_TYPE.SLIDE,
          },
        })
      }
    }

    return newMotions
  }
}
