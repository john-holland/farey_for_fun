FROM archlinux:base

# Install essential packages
RUN pacman -Syu --noconfirm \
    openssh \
    sudo \
    python \
    python-pip \
    docker \
    systemd \
    && pacman -Scc --noconfirm

# Configure SSH
RUN mkdir /var/run/sshd \
    && echo 'root:root' | chpasswd \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Create SSH host keys
RUN ssh-keygen -A

# Install Python dependencies
COPY requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt

# Create work directory
WORKDIR /app

# Copy application files
COPY . /app/

# Expose SSH port
EXPOSE 22

# Start SSH daemon
CMD ["/usr/sbin/sshd", "-D"] 