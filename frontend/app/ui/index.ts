// salmon's shared UI (docs/DESIGN.md section 5). Import from "@/app/ui".
// Files marked "use client" in their own module can still be rendered from
// server components; hooks (useToast) only work in client components.
export { Banner, type BannerProps, type BannerVariant } from "./Banner";
export { Button, type ButtonProps } from "./Button";
export { buttonClass, type ButtonSize, type ButtonVariant } from "./buttonClass";
export { Card, type CardProps, type CardVariant } from "./Card";
export { Chip, MissingGroup, Tag, TropeLink, type ChipKind, type ChipProps } from "./Chip";
export { cx } from "./cx";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { CC_BY_NC_SA_URL, ExternalLink, TVTROPES_URL, type ExternalLinkProps } from "./ExternalLink";
export { FocusedBar, type FocusedBarProps } from "./FocusedBar";
export { Icon, ICON_NAMES, type IconName, type IconProps } from "./Icon";
export { IconButton, type IconButtonProps } from "./IconButton";
export { Disc, List, ListRow, type DiscProps, type ListRowProps } from "./ListRow";
export { FishMark, Logo, type LogoProps } from "./Logo";
export { ConfirmModal, Modal, type ConfirmModalProps, type ModalProps } from "./Modal";
export {
  Meter,
  ResultCard,
  type ResultCardProps,
  type ResultCardWork,
} from "./ResultCard";
export { SaveWorkButton, type SaveWorkButtonProps } from "./SaveWorkButton";
export {
  SegmentedControl,
  segmentIds,
  segmentPanelProps,
  type SegmentedControlProps,
  type SegmentOption,
} from "./SegmentedControl";
export { Delayed, ListRowSkeleton, ResultCardSkeleton, Skeleton, type SkeletonProps } from "./Skeleton";
export { RulePanel, TextField, type Rule, type TextAreaFieldProps, type TextFieldProps } from "./TextField";
export { Providers } from "./Providers";
export { ToastProvider, useToast, type ToastApi, type ToastOptions } from "./Toast";
