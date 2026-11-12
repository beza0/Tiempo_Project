import 'package:flutter/material.dart';

/// Mesaj thread’i, talep durumları ve karşı teklif akışı (en/tr).
class ConversationL10n {
  ConversationL10n._(this._tr);
  final bool _tr;

  static ConversationL10n of(BuildContext context) {
    final code = Localizations.localeOf(context).languageCode.toLowerCase();
    return ConversationL10n._(code.startsWith('tr'));
  }

  String _e(String en, String tr) => _tr ? tr : en;

  String get conversationTitle => _e('Conversation', 'Sohbet');
  String get conversationNotFound => _e('Conversation not found', 'Sohbet bulunamadı');
  String requestsCount(int n) => _e('$n requests', '$n talep');
  String get profileTooltip => _e('Profile', 'Profil');
  String get block => _e('Block user', 'Kullanıcıyı engelle');
  String get unblock => _e('Unblock user', 'Engeli kaldır');
  String get blockConfirmTitle => _e('Block this user?', 'Kullanıcı engellensin mi?');
  String get blockConfirmBody => _e(
        'If you block this user, they will not be able to send you messages. You can unblock them later.',
        'Bu kullanıcıyı engellerseniz size mesaj gönderemez. Daha sonra isterseniz engeli kaldırabilirsiniz.',
      );
  String get blockConfirmAction => _e('Yes, block', 'Evet, engelle');
  String get activeRequest => _e('Active request', 'Aktif talep');
  String offerLine(String schedule, int minutes) =>
      _tr ? 'Teklif · $schedule · $minutes dk' : 'Offer · $schedule · $minutes min';

  /// `toUiStatus` çıktısı (pending-incoming vb.)
  String listUiStatusLabel(String ui) {
    switch (ui) {
      case 'cancelled':
        return _e('Cancelled', 'İptal edildi');
      case 'accepted':
        return _e('Confirmed', 'Onaylandı');
      case 'rejected':
        return _e('Declined', 'Reddedildi');
      case 'completed':
        return _e('Completed', 'Tamamlandı');
      case 'pending-outgoing':
        return _e('Waiting for them', 'Karşı taraf bekleniyor');
      case 'pending-incoming':
        return _e('Needs your response', 'Yanıtınız bekleniyor');
      default:
        return ui;
    }
  }

  /// Sunucudan gelen `PENDING`, `ACCEPTED` vb. (dropdown’da)
  String apiExchangeStatus(String raw) {
    switch (raw.trim().toUpperCase()) {
      case 'PENDING':
        return _e('Pending', 'Beklemede');
      case 'ACCEPTED':
        return _e('Confirmed', 'Onaylandı');
      case 'REJECTED':
        return _e('Rejected', 'Reddedildi');
      case 'CANCELLED':
        return _e('Cancelled', 'İptal');
      case 'COMPLETED':
        return _e('Completed', 'Tamamlandı');
      default:
        return raw;
    }
  }

  String get cancelRequestTitle => _e('Cancel request?', 'Talep iptal edilsin mi?');
  String get no => _e('No', 'Hayır');
  String get yes => _e('Yes', 'Evet');
  String get proposeNewTime => _e('Propose new time', 'Yeni zaman öner');
  String get dateLabel => _e('Date', 'Tarih');
  String get timeLabel => _e('Time', 'Saat');
  String get minutesLabel => _e('Minutes', 'Dakika');
  String get messageLabel => _e('Message', 'Mesaj');
  String get outsideAvailability =>
      _e('Outside skill availability window.', 'Seçilen zaman becerinin uygunluk aralığı dışında.');
  String get sendCounterOffer => _e('Send counter-offer', 'Karşı teklif gönder');
  String counterOfferDefaultMessage(String skillTitle) => _tr
      ? 'Bu saat benim için uygun değil. $skillTitle için başka bir zaman önerebilirim.'
      : 'This time does not work for me. I can offer another time for $skillTitle.';

  String get instructorProposedSlot =>
      _e('The instructor proposed a new time slot.', 'Eğitmen yeni bir zaman önerdi.');
  String otherWantsToConnect(String name) =>
      _tr ? '$name sizinle bağlantı kurmak istiyor.' : '$name wants to connect with you.';
  String get accept => _e('Accept', 'Kabul et');
  String get decline => _e('Decline', 'Reddet');
  String get declineAndPropose =>
      _e('Decline and offer other time', 'Reddet ve yeni zaman öner');
  String waitingForResponse(String name) =>
      _tr ? '$name yanıt bekliyor.' : 'Waiting for $name to respond.';
  String get cancelRequest => _e('Cancel request', 'Talebi iptal et');
  String get rejectedBanner =>
      _e('This request was declined. You can send a new proposal.', 'Bu talep reddedildi. Yeni bir öneri gönderebilirsiniz.');
  String get sendNewProposal => _e('Send new proposal', 'Yeni öneri gönder');
  String get cancelSession => _e('Cancel session', 'Oturumu iptal et');
  String get iStartedLearner => _e('Confirm the session took place', 'Seansın yapıldığını onayla');
  String get iStartedInstructor => _e('Confirm the session took place', 'Seansın yapıldığını onayla');
  String get leaveReview => _e('Leave a review', 'Değerlendirme bırak');
  String get meetingUrlLabel => _e('Meeting URL (Zoom, Meet…)', 'Toplantı bağlantısı (Zoom, Meet…)');
  String get messageHint => _e('Type a message…', 'Mesaj yazın…');
  String get meetingLinkSaved => _e('Meeting link saved', 'Toplantı bağlantısı kaydedildi');
  String get dialogSubmit => _e('Submit', 'Gönder');
  String get cancelAction => _e('Cancel', 'İptal');

  /// Liste özet satırı: "60 dk" / "60 min"
  String bookedMinutesShort(int minutes) => _tr ? '$minutes dk' : '$minutes min';
}
