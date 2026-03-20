import { getKnowledge, type Knowledge } from "@features/knowledge";
import { Collapsible } from "@shared/ui/collapsible";
import { NavArrowDown } from "iconoir-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type Props = {
	knowledgeId: string;
	typeName: string | null;
	typeColor: string | null;
	title: string;
};

const contentCache = new Map<string, Knowledge>();

export const KnowledgeExpandable = ({
	knowledgeId,
	typeName,
	typeColor,
	title,
}: Props) => {
	const { t } = useTranslation();
	const [knowledge, setKnowledge] = useState<Knowledge | null>(
		() => contentCache.get(knowledgeId) ?? null,
	);

	const fetchKnowledge = useCallback(() => {
		getKnowledge(knowledgeId).then((result) => {
			if (result.ok) {
				contentCache.set(knowledgeId, result.value);
				setKnowledge(result.value);
			}
		});
	}, [knowledgeId]);

	useEffect(() => {
		fetchKnowledge();
	}, [fetchKnowledge]);

	const handleOpenChange = useCallback(
		(details: { open: boolean }) => {
			if (details.open) {
				fetchKnowledge();
			}
		},
		[fetchKnowledge],
	);

	return (
		<Collapsible.Root
			defaultOpen={true}
			onOpenChange={handleOpenChange}
			className={styles.expandableRoot}
		>
			<Collapsible.Trigger className={styles.expandableTrigger}>
				<Collapsible.Indicator className={styles.expandableIndicator}>
					<NavArrowDown width={12} height={12} />
				</Collapsible.Indicator>
				<span className={styles.title}>{title}</span>
				{typeName && (
					<span
						className={styles.previewType}
						style={
							{
								"--type-color": typeColor ?? "var(--text-tertiary)",
							} as React.CSSProperties
						}
					>
						{typeName}
					</span>
				)}
			</Collapsible.Trigger>
			<Collapsible.Content>
				<div className={styles.expandableContent}>
					{knowledge === null ? null : knowledge.plain_text ? (
						<p className={styles.expandableText}>
							{knowledge.plain_text.replace(/\n{2,}/g, "\n")}
						</p>
					) : (
						<p className={styles.expandableEmpty}>{t("common.noContent")}</p>
					)}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	);
};
