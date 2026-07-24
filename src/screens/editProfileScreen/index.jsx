import React, { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import styles from './style';
import useToast from '../../hook/useToast';
import { useUserData } from '../../hook/useUserData';
import { UserService } from '../../services/user.service';
import { getProfileImage } from '../../config/utility';
import { useSettings } from '../../hook/useSettings';

const  MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // Default value

const EditProfileScreen = ({ route }) => {
	const navigation = useNavigation();
	const { showError, showSuccess } = useToast();
	const { userData, fetchUserData } = useUserData();
	const insets = useSafeAreaInsets();

	const [profileImageUri, setProfileImageUri] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fullName, setFullName] = useState(userData?.name || '');
	const [email, setEmail] = useState(userData?.email || '');
	const { siteSettings } = useSettings();
	 
	const PROFILE_IMAGE_SIZE = Number(siteSettings?.PROFILE_IMAGE_SIZE) || MAX_PROFILE_IMAGE_SIZE;

	const canSubmit = useMemo(() => {
		return fullName.trim().length > 1 && email.trim().length > 4;
	}, [fullName, email]);

	const onPickProfileImage = () => {
		launchImageLibrary(
			{ mediaType: 'photo', selectionLimit: 1, quality: 0.9 },
			response => {
				if (response.didCancel) return;
				if (response.errorCode) {
					showError('Image Upload', response.errorMessage || 'Failed to pick image');
					return;
				}
				const asset = response?.assets?.[0];
				if (Number(asset?.fileSize || 0) > PROFILE_IMAGE_SIZE) {
					showError('Image Upload', `Please select an image up to ${PROFILE_IMAGE_SIZE / (1024 * 1024)} MB only.`);
					return;
				}
				if (asset?.uri) setProfileImageUri(asset.uri);
			},
		);
	};

	const onSubmit = async () => {
		const trimmedName  = fullName.trim();
		const trimmedEmail = email.trim();

		if (!trimmedName) {
			showError('Validation', 'Please enter your full name.');
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmedEmail)) {
			showError('Validation', 'Please enter a valid email address.');
			return;
		}

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append('name', trimmedName);
			formData.append('email', trimmedEmail);
			if (profileImageUri) {
				const fileName = profileImageUri.split('/').pop();
				formData.append('profile_image', {
					uri: profileImageUri,
					name: fileName,
					type: 'image/jpeg',
				});
			}
			await new Promise((resolve, reject) => {
				UserService.updateProfile(formData, response => {
					if (response.success) resolve(response.data);
					else reject(new Error(response?.error || 'Profile update failed'));
				});
			});
			await fetchUserData();
			setIsSubmitting(false);
			showSuccess('SUCCESS', 'Profile updated successfully.');
		} catch (error) {
			setIsSubmitting(false);
			console.log('❌ Error updating profile:', error?.message);
			showError('Update Failed', error?.message || 'Could not update profile right now.');
		}
	};

	const initial = fullName?.trim()?.charAt(0)?.toUpperCase() || 'U';

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={insets.top}
		>
			{/* ── Fixed header — sits above ScrollView, respects safe area ── */}
			<View style={[styles.header, { paddingTop: insets.top + 10 }]}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
					hitSlop={8}
				>
					<Icon name="arrow-back" size={20} color="#FFFFFF" />
				</TouchableOpacity>

				<View style={styles.headerTextWrap}>
					<Text style={styles.title}>Edit Profile</Text>
					<Text style={styles.subtitle}>UPDATE YOUR ACCOUNT DETAILS</Text>
				</View>
			</View>

			{/* ── Scrollable body ── */}
			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.card}>
					{/* Avatar */}
					<View style={styles.avatarSection}>
						<View style={styles.avatarWrap}>
							{profileImageUri ? (
								<Image
									source={{ uri: profileImageUri }}
									resizeMode="cover"
									style={styles.avatarImage}
								/>
							) : userData?.profile_photo ? (
								<Image
									source={{ uri: getProfileImage(userData.profile_photo) }}
									resizeMode="cover"
									style={styles.avatarImage}
								/>
							) : (
								<Text style={styles.avatarInitial}>{initial}</Text>
							)}
						</View>
						<Text style={styles.uploadHint}>Upload Profile Image (max {PROFILE_IMAGE_SIZE / (1024 * 1024)} MB)</Text>
						<TouchableOpacity style={styles.uploadButton} onPress={onPickProfileImage}>
							<Icon name="photo-camera" size={16} color="#4DA3FF" />
							<Text style={styles.uploadButtonText}>Choose from Gallery</Text>
						</TouchableOpacity>
					</View>

					{/* Full name */}
					<Text style={styles.label}>FULL NAME</Text>
					<View style={styles.inputBox}>
						<Icon name="person" size={18} color="#6B7C99" />
						<TextInput
							value={fullName}
							onChangeText={setFullName}
							placeholder="Enter your full name"
							placeholderTextColor="#93A4C0"
							style={styles.input}
							autoCapitalize="words"
						/>
					</View>

					{/* Email */}
					<Text style={styles.label}>EMAIL ADDRESS</Text>
					<View style={styles.inputBox}>
						<Icon name="alternate-email" size={18} color="#6B7C99" />
						<TextInput
							value={email}
							onChangeText={setEmail}
							placeholder="Enter your email"
							placeholderTextColor="#93A4C0"
							style={styles.input}
							autoCapitalize="none"
							keyboardType="email-address"
						/>
					</View>

					{/* Submit */}
					<TouchableOpacity
						style={[styles.submitBtn, !canSubmit && { opacity: 0.6 }]}
						onPress={onSubmit}
						disabled={isSubmitting || !canSubmit}
					>
						{isSubmitting ? (
							<>
								<ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
								<Text style={styles.submitText}>Submitting...</Text>
							</>
						) : (
							<Text style={styles.submitText}>Submit Profile</Text>
						)}
					</TouchableOpacity>

					<Text style={styles.infoText}>
						This information helps keep your SOS profile accurate for trusted contacts.
					</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default EditProfileScreen;