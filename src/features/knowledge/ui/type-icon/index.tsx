import {
	Bell,
	Bookmark,
	Brain,
	Building,
	ChatBubble,
	Clock,
	Cloud,
	Compass,
	Crown,
	EditPencil,
	Eye,
	Flower,
	Globe,
	Group,
	HalfMoon,
	Heart,
	Home,
	Hourglass,
	Key,
	LightBulb,
	Lock,
	Map as MapIcon,
	MapPin,
	MusicDoubleNote,
	Palette,
	Star,
	SunLight,
	Trophy,
	User,
} from "iconoir-react";
import styles from "./styles.module.css";

type Props = {
	name: string;
	color: string | null;
	icon: string | null;
};

const ICON_MAP: Record<
	string,
	React.ComponentType<{ width: number; height: number }>
> = {
	User,
	Globe,
	EditPencil,
	Star,
	Heart,
	Bookmark,
	LightBulb,
	Crown,
	Key,
	Lock,
	Eye,
	Brain,
	Trophy,
	Palette,
	Bell,
	MusicDoubleNote,
	Group,
	Home,
	Building,
	MapPin,
	Compass,
	SunLight,
	HalfMoon,
	Cloud,
	Flower,
	Clock,
	Hourglass,
	ChatBubble,
	Map: MapIcon,
};

export const TypeIcon = ({ color, icon }: Props) => {
	const style = getKnowledgeTypeStyle({ color, icon });

	if (style.icon && ICON_MAP[style.icon]) {
		const IconComponent = ICON_MAP[style.icon];
		return (
			<span className={styles.iconWrapper}>
				<IconComponent width={14} height={14} />
			</span>
		);
	}

	return (
		<span className={styles.iconWrapper} style={{ width: 14, height: 14 }}>
			<span
				className={styles.colorDot}
				style={{
					backgroundColor: style.color,
				}}
			/>
		</span>
	);
};

function getKnowledgeTypeStyle(type: {
	color: string | null;
	icon: string | null;
}): { color: string; icon: string | null } {
	return {
		color: type.color ?? "#808080",
		icon: type.icon ?? null,
	};
}
