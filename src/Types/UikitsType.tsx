interface SpanType {
  text?: string
  code?: string
  mark?: string
}

export interface CommonCardHeaderProp {
  title: string
  span?: SpanType[]
  headClass?: string
  icon?: JSX.Element
  tagClass?: string
}
