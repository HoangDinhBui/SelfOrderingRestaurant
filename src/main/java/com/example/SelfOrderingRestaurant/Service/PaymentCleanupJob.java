package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PaymentCleanupJob {
    private final PaymentRepository paymentRepository;
    private final Logger log = LoggerFactory.getLogger(PaymentCleanupJob.class);

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredPendingPayments() {
        LocalDateTime expiryThreshold = LocalDateTime.now().minusMinutes(15);
        List<Payment> expiredPayments = paymentRepository.findByStatusAndPaymentDateBefore(PaymentStatus.PENDING, expiryThreshold);

        for (Payment payment : expiredPayments) {
            payment.setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
            log.info("Cancelled expired pending payment for order {} with transaction ID: {}",
                    payment.getOrder().getOrderId(), payment.getTransactionId());
        }
    }
}