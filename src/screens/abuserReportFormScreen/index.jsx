
import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, SafeAreaView,
    StyleSheet, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, Image, ActivityIndicator, FlatList
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { Colors, Typography, Spacing, Radius } from '../../components/abuserReport/theme.jsx';
import {
    FormField, StyledInput, SegmentControl,
    ToggleRow, PrimaryButton, SectionDivider,
} from '../../components/abuserReport/UIKit.jsx';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AbuseReportService } from '../../services/abuseRport.service.js';
import { useNavigation } from '@react-navigation/native';

const MAX_ABUSER_IMAGE_SIZE = 5 * 1024 * 1024;
const ABUSE_TYPES = ['Physical', 'Psychological', 'Sexual', 'Financial', 'Stalking', 'Other'];
const THREAT_LEVELS = ['Low', 'Medium', 'High'];
const EVIDENCE_TYPES = [
    { key: 'document', label: 'Evidence 1', subtitle: 'Primary supporting document', iconName: 'description' },
    { key: 'image', label: 'Evidence 2', subtitle: 'Additional supporting document', iconName: 'folder' },
    { key: 'video', label: 'Evidence 3', subtitle: 'Supplementary supporting document', iconName: 'attach-file' },
];

const formatFileSize = size => {
    const bytes = Number(size || 0);
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatMimeType = mimeType => {
    if (!mimeType) return 'Unknown type';
    return mimeType.split('/').pop()?.toUpperCase() || mimeType;
};

 

const calculateAge = dob => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age >= 0 ? String(age) : null;
};

const normalizeAbuser = item => ({
    id: String(item?.id ?? ''),
    fullName: item?.full_name || '-',
    aliasName: item?.alias_name || '-',
    gender: item?.gender || '-',
    age: calculateAge(item?.dob),
    phone: item?.phone || '-',
    address: item?.address || '-',
    avatar: item?.photo || null,
});

const INITIAL_FORM = {
    fullName: '', aliasName: '', gender: '',
    dob: '', phone: '', email: '', address: '',
    abuseType: '', incidentDate: '', incidentLocation: '',
    description: '', witnessInformation: '',
    threatLevel: 'Low',
    historyOfViolence: false, weaponAccess: false, restrainingOrder: false,
    notes: '',
};

// ── TEST DATA ────────────────────────────────────────────────────────────────
const TEST_FORM = {
    fullName: 'James Holloway',
    aliasName: 'J-Holl',
    gender: 'Male',
    dob: '1985-03-14',
    phone: '+1 555-401-7892',
    email: 'james.holloway@example.com',
    address: '47 Maplewood Drive, San Antonio, TX 78201',
    abuseType: 'Physical',
    incidentDate: '2024-11-22',
    incidentLocation: 'San Antonio, TX',
    description:
        'The subject physically assaulted the victim at the shared residence. The victim sustained bruising on arms and neck. Neighbours reported hearing loud altercations on multiple prior occasions. Subject was under the influence at the time of the incident.',
    witnessInformation:
        'Sarah Mendez (neighbour) – +1 555-310-4421\nOfficer Brett Collins – Badge #4829, SAPD',
    threatLevel: 'High',
    historyOfViolence: true,
    weaponAccess: true,
    restrainingOrder: false,
    notes:
        'Victim has expressed reluctance to press charges due to financial dependency. Follow-up welfare check scheduled for 2024-11-29. Case flagged for priority review.',
};
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportFormScreen({ onNavigateBack }) {
    const [useTestData, setUseTestData] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [abuserPickerOpen, setAbuserPickerOpen] = useState(false);
    const [abuserList, setAbuserList] = useState([]);
    const [abuserListLoading, setAbuserListLoading] = useState(false);
    const [abuserListRefreshing, setAbuserListRefreshing] = useState(false);
    const [deletingAbuserId, setDeletingAbuserId] = useState(null);
    const [selectedAbuser, setSelectedAbuser] = useState(null);
    const [abuserPhoto, setAbuserPhoto] = useState(null);
    const [evidenceFiles, setEvidenceFiles] = useState({ document: null, image: null, video: null });
    const [successModal, setSuccessModal] = useState({ visible: false, reportId: null, abuserName: '' });
    const navigation = useNavigation();

    const handleToggleTestData = () => {
        const next = !useTestData;
        setUseTestData(next);
        setForm(next ? TEST_FORM : INITIAL_FORM);
        setErrors({});
        if (next) setSelectedAbuser(null);
    };

    useEffect(() => {
      if(useTestData){
        setForm(TEST_FORM);
      }else{
        setForm(INITIAL_FORM);
      }

    },[useTestData])

    const fetchExistingAbusers = async (isRefresh = false) => {
        if (isRefresh) setAbuserListRefreshing(true);
        else setAbuserListLoading(true);

        try {
            const response = await new Promise((resolve, reject) => {
                AbuseReportService.getExistingAbuser(result => {
                    if (result.success) resolve(result.data);
                    else reject(new Error(result.error || 'Failed to fetch existing abusers'));
                });
            });

            const payload = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : [];

            setAbuserList(payload.map(normalizeAbuser).filter(item => item.id));
        } catch (error) {
            Alert.alert('Abuser List', error?.message || 'Failed to load existing abusers. Please try again.');
        } finally {
            if (isRefresh) setAbuserListRefreshing(false);
            else setAbuserListLoading(false);
        }
    };

    useEffect(() => {
        if (abuserPickerOpen && abuserList.length === 0) {
            fetchExistingAbusers();
        }
    }, [abuserPickerOpen]);

    const handleSelectAbuser = item => {
        setSelectedAbuser(item);
        setAbuserPickerOpen(false);
        setErrors(prev => ({ ...prev, fullName: null }));
    };

    const handleDeleteAbuser = item => {
        Alert.alert(
            'Delete Abuser',
            `Are you sure you want to delete ${item?.fullName || 'this abuser'}? This action cannot be undone.All report associated with this abuser will also be deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingAbuserId(item.id);
                        try {
                            const response = await new Promise((resolve, reject) => {
                                AbuseReportService.deleteAbuser(item.id, result => {
                                    if (result.success) resolve(result.data);
                                    else reject(new Error(result.error || 'Failed to delete abuser'));
                                });
                            });

                            const status = response?.status;
                            if (status && status !== 200 && status !== 204) {
                                throw new Error(response?.message || 'Failed to delete abuser');
                            }

                            if (selectedAbuser?.id === item.id) {
                                setSelectedAbuser(null);
                            }

                            setAbuserList(prev => prev.filter(abuser => abuser.id !== item.id));
                            Alert.alert('Abuser List', 'Abuser deleted successfully.');
                        } catch (error) {
                            Alert.alert('Abuser List', error?.message || 'Failed to delete abuser. Please try again.');
                        } finally {
                            setDeletingAbuserId(null);
                        }
                    },
                },
            ],
        );
    };

    const set = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
    };

    const validate = () => {
        const e = {};
        if (!selectedAbuser && !form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.abuseType) e.abuseType = 'Select an abuse type';
        if (!form.incidentDate.trim()) e.incidentDate = 'Incident date is required';
        if (form.incidentDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.incidentDate.trim())) e.incidentDate = 'Incident date must be in YYYY-MM-DD format';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.threatLevel) e.threatLevel = 'Select a threat level';
        if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob.trim())) e.dob = 'Date of birth must be in YYYY-MM-DD format';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handlePickAbuserPhoto = () => {
        launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 }, response => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Image Upload', response.errorMessage || 'Failed to pick image'); return; }
            const asset = response?.assets?.[0];
            if (!asset?.uri) { Alert.alert('Image Upload', 'No image was selected. Please try again.'); return; }
            if (Number(asset?.fileSize || 0) > MAX_ABUSER_IMAGE_SIZE) { Alert.alert('Image Upload', 'Please select an image up to 5 MB only.'); return; }
            setAbuserPhoto({ uri: asset.uri, name: asset.fileName || form.fullName?.trim() || 'Abuser photo', type: asset.type || 'image/jpeg', fileSize: asset.fileSize || 0 });
        });
    };

    const handlePickEvidence = async type => {
        try {
            const [file] = await pick({ type: [types.allFiles] });
            if (!file?.uri) return;
            setEvidenceFiles(prev => ({ ...prev, [type]: { name: file?.name || `${type}_file`, mimeType: file?.type || 'application/octet-stream', uri: file.uri, size: file?.size || 0 } }));
        } catch (err) {
            if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) Alert.alert('File Picker', 'Could not pick a file. Please try again.');
        }
    };

    const clearEvidence = type => setEvidenceFiles(prev => ({ ...prev, [type]: null }));

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        setSelectedAbuser(null);
        setAbuserPhoto(null);
        setEvidenceFiles({ document: null, image: null, video: null });
        setUseTestData(false);
    };

    const handleSubmit = async () => {
        if (!validate()) { Alert.alert('Validation Error', 'Please correct the highlighted fields before submitting.'); return; }
        setSaving(true);
        let abuserID = selectedAbuser?.id || null;
        if (!abuserID) {
            const newAbuserFormData = new FormData();
            form.fullName && newAbuserFormData.append('full_name', form.fullName);
            form.aliasName && newAbuserFormData.append('alias_name', form.aliasName);
            form.gender && newAbuserFormData.append('gender', form.gender);
            form.dob && newAbuserFormData.append('dob', form.dob);
            form.phone && newAbuserFormData.append('phone', form.phone);
            form.email && newAbuserFormData.append('email', form.email);
            form.address && newAbuserFormData.append('address', form.address);
            if (abuserPhoto) newAbuserFormData.append('photo', { uri: abuserPhoto.uri, name: abuserPhoto.name, type: abuserPhoto.type });

            const responseNewAbuser = await new Promise((resolve) => {
                AbuseReportService.registerNewAbuser(newAbuserFormData, (result) => {
                    if (result.success) resolve(result.data);
                    else Alert.alert('Error', 'Failed to register new abuser: ' + result.error);
                });
            });

            abuserID = responseNewAbuser?.id;
        }

        if (abuserID) {
            const reportFormData = new FormData();
            reportFormData.append('abuser_id', abuserID);
            form.abuseType && reportFormData.append('abuse_type', form.abuseType);
            form.incidentDate && reportFormData.append('incident_date', form.incidentDate);
            form.incidentLocation && reportFormData.append('incident_location', form.incidentLocation);
            form.description && reportFormData.append('description', form.description);
            form.witnessInformation && reportFormData.append('witness_information', form.witnessInformation);
            form.threatLevel && reportFormData.append('threat_level', form.threatLevel);
            form.historyOfViolence && reportFormData.append('history_of_violence', form.historyOfViolence);
            form.weaponAccess && reportFormData.append('weapon_access', form.weaponAccess);
            form.restrainingOrder && reportFormData.append('restraining_order', form.restrainingOrder);
            form.notes && reportFormData.append('notes', form.notes);
            Object.entries(evidenceFiles).forEach(([key, file]) => {
                if (file) reportFormData.append('evidence_files', { uri: file.uri, name: file.name, type: file.mimeType });
            });

            const responseReport = await new Promise((resolve) => {
                AbuseReportService.registerNewAbuseReport(reportFormData, (result) => {
                    if (result.success) resolve(result.data);
                    else Alert.alert('Error', 'Failed to submit abuse report: ' + result.error);
                });
            });

            if (responseReport?.id) {
                setSaving(false);
                setSuccessModal({
                    visible: true,
                    reportId: responseReport.id,
                    abuserName: selectedAbuser?.fullName || form.fullName || 'Unknown',
                });
                resetForm();
            } else {
                setSaving(false);
                Alert.alert('Error', 'Failed to submit abuse report. Please try again.');
            }
        } else {
            setSaving(false);
            Alert.alert('Error', 'Failed to register new abuser. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                <View style={styles.headerWrap}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.75}>
                                <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Abuse report</Text>
                            <TouchableOpacity onPress={()=>navigation.navigate('ReportList')} style={styles.resetButton} activeOpacity={0.85}>
                                <Icon name="list" size={18} color={Colors.accent} />
                                <Text style={styles.resetButtonText}>List reports</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            All information will handled with strict confidentiality.
                            Provide incident details so the report can be reviewed and acted on quickly.
                        </Text>
                    </View>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* ── DEV: TEST DATA TOGGLE ───────────────────────────── */}
                    {/* <TouchableOpacity
                        style={[styles.testDataToggle, useTestData && styles.testDataToggleActive]}
                        onPress={handleToggleTestData}
                        activeOpacity={0.8}
                    >
                        <View style={styles.testDataToggleLeft}>
                            <View style={[styles.testDataDot, useTestData && styles.testDataDotActive]} />
                            <View>
                                <Text style={[styles.testDataToggleLabel, useTestData && styles.testDataToggleLabelActive]}>
                                    {useTestData ? 'Test Data: ON' : 'Test Data: OFF'}
                                </Text>
                                <Text style={styles.testDataToggleHint}>
                                    {useTestData ? 'Form is pre-filled with sample data' : 'Tap to pre-fill form for testing'}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.testDataPill, useTestData && styles.testDataPillActive]}>
                            <Text style={[styles.testDataPillText, useTestData && styles.testDataPillTextActive]}>
                                {useTestData ? 'ENABLED' : 'DEV'}
                            </Text>
                        </View>
                    </TouchableOpacity> */}

                    <SectionDivider title="Abuser Selection" />

                    <View style={styles.selectionCard}>
                        <Text style={styles.selectionCardTitle}>Use Existing Abuser Profile</Text>
                        <Text style={styles.selectionCardBody}>Select from existing records or create a new profile manually.</Text>
                        <View style={styles.selectionActionRow}>
                            <PrimaryButton title={selectedAbuser ? 'Change Existing Abuser' : 'Select Existing Abuser'} onPress={() => setAbuserPickerOpen(true)} style={styles.selectionPrimaryBtn} />
                            {!!selectedAbuser && <PrimaryButton title="Use New Abuser" variant="outline" onPress={() => setSelectedAbuser(null)} style={styles.selectionSecondaryBtn} />}
                        </View>
                    </View>

                    {!!selectedAbuser && (
                        <View style={styles.selectedAbuserCard}>
                            <Image source={{ uri: selectedAbuser.avatar }} style={styles.selectedAbuserAvatar} />
                            <View style={{ flex: 1 }}>
                                <View style={styles.selectedAbuserTopRow}>
                                    <Text style={styles.selectedAbuserName}>{selectedAbuser.fullName}</Text>
                                    <Text style={styles.selectedAbuserTag}>Existing</Text>
                                </View>
                                <Text style={styles.selectedAbuserMeta}>ID: {selectedAbuser.id} • Alias: {selectedAbuser.aliasName}</Text>
                                <Text style={styles.selectedAbuserMeta}>{selectedAbuser.gender}{selectedAbuser.age ? ` • Age ${selectedAbuser.age}` : ''}</Text>
                                <Text style={styles.selectedAbuserMeta}>{selectedAbuser.phone}</Text>
                                <Text style={styles.selectedAbuserMeta}>{selectedAbuser.address}</Text>
                            </View>
                        </View>
                    )}

                    {!selectedAbuser && <SectionDivider title="Abuser Identity" />}

                    {!selectedAbuser && (
                        <View style={styles.profilePhotoCard}>
                            <Text style={styles.profilePhotoTitle}>Abuser Display Picture</Text>
                            <View style={styles.profilePhotoRow}>
                                <View style={styles.profileAvatarOuter}>
                                    {abuserPhoto
                                        ? <Image source={{ uri: abuserPhoto.uri }} style={styles.profileAvatarImage} />
                                        : <View style={styles.profileAvatarEmpty}><Text style={styles.profileAvatarIcon}>📷</Text></View>
                                    }
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profilePhotoHint}>Upload profile image for quick visual identification.</Text>
                                    <View style={styles.profilePhotoActions}>
                                        <PrimaryButton title={abuserPhoto ? 'Change Photo' : 'Upload Photo'} onPress={handlePickAbuserPhoto} style={styles.photoUploadBtn} />
                                        {!!abuserPhoto && <PrimaryButton title="Remove" variant="outline" onPress={() => setAbuserPhoto(null)} style={styles.photoRemoveBtn} />}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {!selectedAbuser && (
                        <>
                            <FormField label="Full Name" required error={errors.fullName}>
                                <StyledInput placeholder="Enter full legal name" value={form.fullName} onChangeText={v => set('fullName', v)} error={errors.fullName} />
                            </FormField>
                            <FormField label="Known Alias / Nickname">
                                <StyledInput placeholder="e.g. Street name or nickname" value={form.aliasName} onChangeText={v => set('aliasName', v)} />
                            </FormField>
                            <View style={styles.row}>
                                <FormField label="Gender" style={styles.halfField}>
                                    <StyledInput placeholder="e.g. Male / Female" value={form.gender} onChangeText={v => set('gender', v)} />
                                </FormField>
                                <FormField label="Date of Birth" error={errors.dob} style={styles.halfField}>
                                    <StyledInput placeholder="YYYY-MM-DD" value={form.dob} onChangeText={v => set('dob', v)} keyboardType="numbers-and-punctuation" error={errors.dob} />
                                </FormField>
                            </View>
                            <View style={styles.row}>
                                <FormField label="Phone" style={styles.halfField}>
                                    <StyledInput placeholder="+1 555-0000" value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
                                </FormField>
                                <FormField label="Email" style={styles.halfField}>
                                    <StyledInput placeholder="Email address" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
                                </FormField>
                            </View>
                            <FormField label="Last Known Address">
                                <StyledInput placeholder="Street, city, state" value={form.address} onChangeText={v => set('address', v)} multiline />
                            </FormField>
                        </>
                    )}

                    <SectionDivider title="Incident Details" />

                    <FormField label="Type of Abuse" required error={errors.abuseType}>
                        <View style={styles.typeGrid}>
                            {ABUSE_TYPES.map(t => {
                                const active = form.abuseType === t;
                                return (
                                    <TouchableOpacity key={t} onPress={() => set('abuseType', t)} style={[styles.typeChip, active && styles.typeChipActive]} activeOpacity={0.7}>
                                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </FormField>

                    <View style={styles.row}>
                        <FormField label="Incident Date" required error={errors.incidentDate} style={styles.halfField}>
                            <StyledInput placeholder="YYYY-MM-DD" value={form.incidentDate} onChangeText={v => set('incidentDate', v)} keyboardType="numbers-and-punctuation" error={errors.incidentDate} />
                        </FormField>
                        <FormField label="Location" style={styles.halfField}>
                            <StyledInput placeholder="City or address" value={form.incidentLocation} onChangeText={v => set('incidentLocation', v)} />
                        </FormField>
                    </View>

                    <FormField label="Incident Description" required error={errors.description}>
                        <StyledInput placeholder="Describe what happened in detail…" value={form.description} onChangeText={v => set('description', v)} multiline style={{ minHeight: 120 }} error={errors.description} />
                    </FormField>

                    <FormField label="Witness Information">
                        <StyledInput placeholder="Names, contact info, or statements…" value={form.witnessInformation} onChangeText={v => set('witnessInformation', v)} multiline />
                    </FormField>

                    <SectionDivider title="Evidence File" />
                    <View style={styles.evidenceGrid}>
                        {EVIDENCE_TYPES.map(item => {
                            const selected = evidenceFiles[item.key];
                            return (
                                <View key={item.key} style={styles.evidenceCard}>
                                    <View style={styles.evidenceTop}>
                                        <View style={styles.evidenceHeaderRow}>
                                            <View style={styles.evidenceIconWrap}>
                                                <Icon name={item.iconName} size={18} color={Colors.accent} />
                                            </View>
                                            <View style={styles.evidenceTitleWrap}>
                                                <Text style={styles.evidenceLabel}>{item.label}</Text>
                                                <Text style={styles.evidenceHint}>{item.subtitle}</Text>
                                            </View>
                                        </View>
                                        {!!selected && <View style={styles.evidenceStatusBadge}><Text style={styles.evidenceStatusText}>Attached</Text></View>}
                                    </View>
                                    {selected ? (
                                        <>
                                            <View style={styles.evidenceFileCard}>
                                                <View style={styles.evidenceFileTopRow}>
                                                    <Icon name="insert-drive-file" size={18} color={Colors.textSecondary} />
                                                    <Text style={styles.evidenceFileName} numberOfLines={2}>{selected.name}</Text>
                                                </View>
                                                <View style={styles.evidenceMetaRow}>
                                                    <View style={styles.evidenceMetaPill}><Text style={styles.evidenceMetaPillText}>{formatMimeType(selected.mimeType)}</Text></View>
                                                    <View style={styles.evidenceMetaPill}><Text style={styles.evidenceMetaPillText}>{formatFileSize(selected.size)}</Text></View>
                                                </View>
                                                <Text style={styles.evidenceFileHelper}>Tap Change to replace this file</Text>
                                            </View>
                                            <View style={styles.evidenceActionRow}>
                                                <TouchableOpacity style={styles.evidenceSmallBtn} onPress={() => handlePickEvidence(item.key)}><Text style={styles.evidenceSmallBtnText}>Change</Text></TouchableOpacity>
                                                <TouchableOpacity style={styles.evidenceSmallBtnOutline} onPress={() => clearEvidence(item.key)}><Text style={styles.evidenceSmallBtnOutlineText}>Remove</Text></TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <TouchableOpacity style={styles.evidenceUploadBtn} onPress={() => handlePickEvidence(item.key)} activeOpacity={0.75}>
                                            <Icon name="upload-file" size={18} color={Colors.accent} />
                                            <Text style={styles.evidenceUploadText}>Attach Document</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <SectionDivider title="Risk Assessment" />

                    <FormField label="Threat Level" required error={errors.threatLevel}>
                        <SegmentControl options={THREAT_LEVELS} value={form.threatLevel} onChange={v => set('threatLevel', v)} />
                    </FormField>

                    <View style={styles.toggleCard}>
                        <ToggleRow label="History of Violence" value={form.historyOfViolence} onToggle={() => set('historyOfViolence', !form.historyOfViolence)} />
                        <View style={styles.toggleDivider} />
                        <ToggleRow label="Weapon Access" value={form.weaponAccess} onToggle={() => set('weaponAccess', !form.weaponAccess)} />
                        <View style={styles.toggleDivider} />
                        <ToggleRow label="Restraining Order in Place" value={form.restrainingOrder} onToggle={() => set('restrainingOrder', !form.restrainingOrder)} />
                    </View>

                    <SectionDivider title="Internal Notes" />

                    <FormField label="Additional Notes">
                        <StyledInput placeholder="Any additional context, updates, or case notes…" value={form.notes} onChangeText={v => set('notes', v)} multiline style={{ minHeight: 90 }} />
                    </FormField>

 <View style={styles.submitFloatingWrap}>
                    <View style={styles.submitRow}>
                        <PrimaryButton title="Reset" variant="outline" onPress={resetForm} style={styles.clearFormBtn} />
                        <PrimaryButton title={saving ? '' : 'Submit Report'} onPress={handleSubmit} loading={saving} style={styles.submitBtn} />
                    </View>
                </View>
                </ScrollView>

               
            </KeyboardAvoidingView>

            {/* ── ABUSER PICKER MODAL ─────────────────────────────────────── */}
            <Modal visible={abuserPickerOpen} transparent animationType="fade" onRequestClose={() => setAbuserPickerOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Existing Abuser</Text>
                        {abuserListLoading ? (
                            <View style={styles.modalLoaderWrap}>
                                <ActivityIndicator size="small" color={Colors.accent} />
                                <Text style={styles.modalLoaderText}>Loading abuser list...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={abuserList}
                                keyExtractor={item => item.id}
                                style={styles.modalList}
                                showsVerticalScrollIndicator={false}
                                refreshing={abuserListRefreshing}
                                onRefresh={() => fetchExistingAbusers(true)}
                                renderItem={({ item }) => (
                                    <View
                                        key={item.id}
                                        style={styles.modalRow}
                                    >
                                        {item.avatar ? <Image source={{ uri: item.avatar }} style={styles.modalAvatar} /> : <View style={styles.modalAvatarEmpty}><Text style={styles.modalAvatarIcon}>👤</Text></View>}
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.modalNameRow}>
                                                <Text style={styles.modalName}>{item.fullName}</Text>
                                            </View>
                                            <Text style={styles.modalMeta}>Alias: {item.aliasName}</Text>
                                            <Text style={styles.modalMeta}>{item.gender}{item.age ? ` • Age ${item.age}` : ''}</Text>
                                            <Text style={styles.modalMeta}>{item.phone}</Text>
                                            <Text style={styles.modalMeta}>{item.address}</Text>
                                            <View style={styles.modalActionRow}>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    style={styles.modalSelectBtn}
                                                    onPress={() => handleSelectAbuser(item)}
                                                >
                                                    <Text style={styles.modalSelectBtnText}>Select</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    style={[styles.modalDeleteBtn, deletingAbuserId === item.id && styles.modalDeleteBtnDisabled]}
                                                    onPress={() => handleDeleteAbuser(item)}
                                                    disabled={deletingAbuserId === item.id}
                                                >
                                                    {deletingAbuserId === item.id
                                                        ? <ActivityIndicator size="small" color="#fff" />
                                                        : <Text style={styles.modalDeleteBtnText}>Delete</Text>
                                                    }
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.modalEmptyWrap}>
                                        <Text style={styles.modalEmptyText}>No existing abusers found.</Text>
                                        <Text style={styles.modalEmptySubText}>Pull down to refresh the list.</Text>
                                    </View>
                                }
                            />
                        )}
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAbuserPickerOpen(false)}>
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── SUCCESS MODAL ───────────────────────────────────────────── */}
            <Modal visible={successModal.visible} transparent animationType="fade" onRequestClose={() => { }}>
                <View style={styles.successOverlay}>
                    <View style={styles.successCard}>
                        {/* Animated check circle */}
                        <View style={styles.successIconOuter}>
                            <View style={styles.successIconInner}>
                                <Icon name="check" size={36} color="#fff" />
                            </View>
                        </View>

                        <Text style={styles.successTitle}>Report Submitted</Text>
                        <Text style={styles.successSubtitle}>
                            The abuse report has been filed successfully and is now under review.
                        </Text>

                        {/* Report details summary */}
                        <View style={styles.successDetailsCard}>
                            <View style={styles.successDetailRow}>
                                <Icon name="badge" size={15} color={Colors.textSecondary} />
                                <Text style={styles.successDetailLabel}>Report ID</Text>
                                <Text style={styles.successDetailValue}>#{successModal.reportId}</Text>
                            </View>
                            <View style={styles.successDetailDivider} />
                            <View style={styles.successDetailRow}>
                                <Icon name="person" size={15} color={Colors.textSecondary} />
                                <Text style={styles.successDetailLabel}>Abuser</Text>
                                <Text style={styles.successDetailValue} numberOfLines={1}>{successModal.abuserName}</Text>
                            </View>
                            <View style={styles.successDetailDivider} />
                            <View style={styles.successDetailRow}>
                                <Icon name="schedule" size={15} color={Colors.textSecondary} />
                                <Text style={styles.successDetailLabel}>Filed on</Text>
                                <Text style={styles.successDetailValue}>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.successActionCol}>
                            <TouchableOpacity
                                style={styles.successBtnPrimary}
                                activeOpacity={0.85}
                                onPress={() => {
                                    setSuccessModal({ visible: false, reportId: null, abuserName: '' });
                                    navigation.navigate('ReportList'); // adjust route name to match your navigator
                                }}
                            >
                                <Icon name="list-alt" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.successBtnPrimaryText}>Go to Report List</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.successBtnOutline}
                                activeOpacity={0.75}
                                onPress={() => {
                                    setSuccessModal({ visible: false, reportId: null, abuserName: '' });
                                    resetForm();
                                }}
                            >
                                <Icon name="add-circle-outline" size={18} color={Colors.accent} style={{ marginRight: 8 }} />
                                <Text style={styles.successBtnOutlineText}>File Another Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {saving && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator animating={saving} size="large" color={Colors.accent} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.base, paddingTop: 0, paddingBottom: Spacing.xl },

    headerWrap: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
    header: { marginBottom: Spacing.base },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backButton: { marginRight: 12 },
    headerTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', letterSpacing: 0.2, flex: 1 },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radius.pill,
        backgroundColor: Colors.accentMuted,
        borderWidth: 1,
        borderColor: Colors.accentGlow,
    },
    resetButtonText: {
        ...Typography.captionBold,
        color: Colors.accent,
        letterSpacing: 0.2,
    },
    headerSubtitle: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20, marginTop: 8 },

    // Test data toggle
    testDataToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, borderStyle: 'dashed', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, marginBottom: Spacing.lg },
    testDataToggleActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.06)', borderStyle: 'solid' },
    testDataToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    testDataDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.divider },
    testDataDotActive: { backgroundColor: '#F59E0B' },
    testDataToggleLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    testDataToggleLabelActive: { color: '#F59E0B' },
    testDataToggleHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    testDataPill: { borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.inputBg },
    testDataPillActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.12)' },
    testDataPillText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
    testDataPillTextActive: { color: '#F59E0B' },

    row: { flexDirection: 'row', gap: Spacing.md },
    halfField: { flex: 1 },

    selectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, padding: Spacing.base, marginBottom: Spacing.lg },
    selectionCardTitle: { ...Typography.bodyBold, marginBottom: 6 },
    selectionCardBody: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 12 },
    selectionActionRow: { flexDirection: 'row', gap: Spacing.md },
    selectionPrimaryBtn: { flex: 2 },
    selectionSecondaryBtn: { flex: 1 },

    selectedAbuserCard: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.accentGlow, padding: Spacing.base, marginBottom: Spacing.xl },
    selectedAbuserAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: Colors.accent },
    selectedAbuserTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    selectedAbuserName: { ...Typography.bodyBold, flexShrink: 1, paddingRight: 8 },
    selectedAbuserTag: { ...Typography.captionBold, color: Colors.accent, backgroundColor: Colors.accentMuted, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    selectedAbuserMeta: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

    profilePhotoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, padding: Spacing.base, marginBottom: Spacing.lg },
    profilePhotoTitle: { ...Typography.bodyBold, marginBottom: 10 },
    profilePhotoRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
    profileAvatarOuter: { width: 72, height: 72 },
    profileAvatarEmpty: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center' },
    profileAvatarImage: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: Colors.accent },
    profileAvatarIcon: { fontSize: 22 },
    profilePhotoHint: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 10 },
    profilePhotoActions: { flexDirection: 'row', gap: Spacing.md },
    photoUploadBtn: { flex: 2 },
    photoRemoveBtn: { flex: 1 },

    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.inputBg },
    typeChipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
    typeChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
    typeChipTextActive: { color: Colors.accent, fontWeight: '700' },

    toggleCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
    toggleDivider: { height: 1, backgroundColor: Colors.divider },

    evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
    evidenceCard: { flexGrow: 1, flexBasis: '30%', minWidth: 160, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, padding: Spacing.md, minHeight: 200 },
    evidenceTop: { marginBottom: 12 },
    evidenceHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    evidenceTitleWrap: { flex: 1 },
    evidenceIconWrap: { backgroundColor: Colors.accentMuted, borderRadius: 999, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    evidenceLabel: { ...Typography.bodyBold },
    evidenceHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
    evidenceStatusBadge: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accentGlow, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
    evidenceStatusText: { ...Typography.captionBold, color: Colors.accent },
    evidenceFileCard: { borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.md, backgroundColor: Colors.inputBg, padding: 11, marginBottom: 10 },
    evidenceFileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    evidenceFileName: { ...Typography.captionBold, color: Colors.textSecondary, lineHeight: 18, flex: 1 },
    evidenceMetaRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    evidenceMetaPill: { borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: Colors.surface },
    evidenceMetaPillText: { ...Typography.captionBold, color: Colors.textSecondary, fontSize: 10 },
    evidenceFileHelper: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 15 },
    evidenceUploadBtn: { flexDirection: 'row', gap: 6, marginTop: 'auto', borderWidth: 1, borderColor: Colors.accentGlow, backgroundColor: Colors.accentMuted, borderRadius: Radius.md, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
    evidenceUploadText: { ...Typography.captionBold, color: Colors.accent },
    evidenceActionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
    evidenceSmallBtn: { flex: 1, backgroundColor: Colors.accentMuted, borderRadius: Radius.md, alignItems: 'center', paddingVertical: 8 },
    evidenceSmallBtnText: { ...Typography.captionBold, color: Colors.accent },
    evidenceSmallBtnOutline: { flex: 1, borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.md, alignItems: 'center', paddingVertical: 8 },
    evidenceSmallBtnOutlineText: { ...Typography.captionBold, color: Colors.textSecondary },

    submitFloatingWrap: { marginTop: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.lg, padding: Spacing.md },
    submitRow: { flexDirection: 'row', gap: Spacing.md },
    clearFormBtn: { flex: 1 },
    submitBtn: { flex: 2 },

    // Abuser picker modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: Spacing.base, justifyContent: 'center' },
    modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider, maxHeight: '82%', padding: Spacing.base },
    modalTitle: { ...Typography.h4, marginBottom: Spacing.base },
    modalList: { maxHeight: 420 },
    modalLoaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
    modalLoaderText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 8 },
    modalEmptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
    modalEmptyText: { ...Typography.bodyBold, color: Colors.textPrimary },
    modalEmptySubText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
    modalRow: { flexDirection: 'row', gap: Spacing.md, borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.inputBg },
    modalAvatar: { width: 54, height: 54, borderRadius: 27 },
    modalAvatarEmpty: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
    modalAvatarIcon: { fontSize: 20 },
    modalNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    modalName: { ...Typography.bodyBold, flexShrink: 1, paddingRight: 8 },
    modalRisk: { ...Typography.captionBold, color: Colors.accent },
    modalMeta: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17 },
    modalActionRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
    modalSelectBtn: { flex: 1, backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accentGlow, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    modalSelectBtnText: { ...Typography.captionBold, color: Colors.accent },
    modalDeleteBtn: { flex: 1, backgroundColor: '#DC2626', borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    modalDeleteBtnDisabled: { opacity: 0.7 },
    modalDeleteBtnText: { ...Typography.captionBold, color: '#fff' },
    modalCloseBtn: { marginTop: Spacing.md, backgroundColor: Colors.accent, borderRadius: Radius.md, alignItems: 'center', paddingVertical: 11 },
    modalCloseText: { ...Typography.captionBold, color: '#fff' },

    // ── Success modal ──────────────────────────────────────────────────────────
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
    },
    successCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.divider,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    successIconOuter: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(34,197,94,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.3)',
    },
    successIconInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.sm,
    },
    successDetailsCard: {
        width: '100%',
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.divider,
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.xl,
    },
    successDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    successDetailDivider: {
        height: 1,
        backgroundColor: Colors.divider,
    },
    successDetailLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        flex: 1,
    },
    successDetailValue: {
        ...Typography.captionBold,
        color: Colors.textPrimary,
        maxWidth: '55%',
        textAlign: 'right',
    },
    successActionCol: {
        width: '100%',
        gap: Spacing.md,
    },
    successBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.accent,
        borderRadius: Radius.md,
        paddingVertical: 14,
    },
    successBtnPrimaryText: {
        ...Typography.bodyBold,
        color: '#fff',
    },
    successBtnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.accentGlow,
        backgroundColor: Colors.accentMuted,
        borderRadius: Radius.md,
        paddingVertical: 14,
    },
    successBtnOutlineText: {
        ...Typography.bodyBold,
        color: Colors.accent,
    },
});
