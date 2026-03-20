import { Portal } from "@ark-ui/react/portal";
import { createListCollection, Select } from "@ark-ui/react/select";
import { Check, NavArrowDown } from "iconoir-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type FontSelectItem = {
	label: string;
	value: string;
	group: "preset" | "system";
};

type Props = {
	presets: { value: string; labelKey: string }[];
	systemFonts: string[];
	value: string;
	onValueChange: (value: string) => void;
	onPrefetch?: () => void;
};

export const FontSelect = ({
	presets,
	systemFonts,
	value,
	onValueChange,
	onPrefetch,
}: Props) => {
	const { t } = useTranslation();
	const allItems = useMemo(() => {
		const presetItems: FontSelectItem[] = presets.map((p) => ({
			label: t(p.labelKey),
			value: p.value,
			group: "preset" as const,
		}));
		const systemItems: FontSelectItem[] = systemFonts.map((name) => ({
			label: name,
			value: name,
			group: "system" as const,
		}));
		return [...presetItems, ...systemItems];
	}, [presets, systemFonts, t]);

	const collection = useMemo(
		() => createListCollection({ items: allItems }),
		[allItems],
	);

	const presetGroup = allItems.filter((i) => i.group === "preset");
	const systemGroup = allItems.filter((i) => i.group === "system");

	return (
		<Select.Root
			className={styles.root}
			collection={collection}
			value={[value]}
			onValueChange={({ value: vals }) => {
				const selected = vals[0];
				if (selected) {
					onValueChange(selected);
				}
			}}
		>
			<Select.Control className={styles.control}>
				<Select.Trigger className={styles.trigger} onPointerEnter={onPrefetch}>
					<Select.ValueText
						placeholder={t("settings.editorPanel.fontFamily")}
					/>
					<Select.Indicator className={styles.indicator}>
						<NavArrowDown width={16} height={16} strokeWidth={2} />
					</Select.Indicator>
				</Select.Trigger>
			</Select.Control>
			<Portal>
				<Select.Positioner>
					<Select.Content className={styles.content}>
						{presetGroup.length > 0 && (
							<Select.ItemGroup>
								<Select.ItemGroupLabel className={styles.groupLabel}>
									{t("settings.editorPanel.presets")}
								</Select.ItemGroupLabel>
								{presetGroup.map((item) => (
									<Select.Item
										key={item.value}
										item={item}
										className={styles.item}
									>
										<Select.ItemText className={styles.itemText}>
											{item.label}
										</Select.ItemText>
										<span className={styles.checkIcon}>
											<Check width={16} height={16} />
										</span>
									</Select.Item>
								))}
							</Select.ItemGroup>
						)}
						{systemGroup.length > 0 && (
							<Select.ItemGroup>
								<Select.ItemGroupLabel className={styles.groupLabel}>
									{t("settings.editorPanel.systemFonts")}
								</Select.ItemGroupLabel>
								{systemGroup.map((item) => (
									<Select.Item
										key={item.value}
										item={item}
										className={styles.item}
									>
										<Select.ItemText
											className={styles.itemText}
											style={{ fontFamily: `"${item.value}"` }}
										>
											{item.label}
										</Select.ItemText>
										<span className={styles.checkIcon}>
											<Check width={16} height={16} />
										</span>
									</Select.Item>
								))}
							</Select.ItemGroup>
						)}
					</Select.Content>
				</Select.Positioner>
			</Portal>
			<Select.HiddenSelect />
		</Select.Root>
	);
};
