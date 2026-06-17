import { Popup } from '../../../shared/ui/Popup';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { Button } from '../../../shared/ui/Button';

interface ResumeConfirmPopupProps {
	isOpen: boolean;
	onResume: () => void;
	onReturn: () => void;
}

export function ResumeConfirmPopup({ isOpen, onResume, onReturn }: ResumeConfirmPopupProps) {
	const textPrimary = THEME_CONFIG.colors.text.primary;
	const textSecondary = THEME_CONFIG.colors.text.secondary;

	return (
		<Popup
			isOpen={isOpen}
			onClose={onReturn}
			title="Resume Level"
			showCloseButton
			footer={
				<div className="w-full flex justify-end gap-2">
					<Button variant="outline" onClick={onReturn}>
						Return to Level Select
					</Button>
					<Button variant="success" onClick={onResume}>
						Resume
					</Button>
				</div>
			}
		>
			<div className="space-y-2">
				<p className={`${textPrimary}`}>You are about to resume this level.</p>
				<p className={`${textSecondary}`}>Would you like to continue or return to level select?</p>
			</div>
		</Popup>
	);
}


